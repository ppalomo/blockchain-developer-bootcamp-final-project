//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IPlasmids.sol";
import "./interfaces/IStakingAdapter.sol";
import "hardhat/console.sol";

/**
 @title Factory that controls the Plasmids minting and management.
 */
contract PlasmidsFactory is Ownable, ReentrancyGuard {

    // Structs
    struct NFT {
        uint id; // NFT unique identifier
        uint initialWeight; // Special NFT Initial weight
        uint weight; // Current NFT weight
        uint startingBlock; // NFT starting block
    }

    struct UserInfo {
        uint userWeight; // Total NFT weights that belongs to this user
        uint lastRedeemBlock; // Last redeem block
        bool exists; // Boolean to control user existance
        NFT[] nfts; // NFTs collection
    }

    // Constants
    uint constant public maxInitialWeight = 300; // Maximum initial weight that an special NFT can have
    uint constant public maxWeight = 1000; // Maximum weight that an special NFT can have
    uint constant public weightIncrement = 10; // Weight increase for each redeem

    // Variables
    IPlasmids private nft; // Plasmids NFT contract
    IStakingAdapter private stakingAdapter; // Staking adapter contract
    uint public maxSupply; // Max NFTs that can exist
    uint public mintingPrice; // Minting price
    uint public specialProbability; // Probability to mint an special NFT. Should be between 0 and 100
    uint[] public attributes; // Dna attributes list
    mapping(address => string) private nextDna; // Next DNA reserved for a particular user
    mapping(string => bool) private dnas; // DNAs already minted. A DNA cannot be repeated

    mapping(address => UserInfo) public users; // Collection of users information
    uint public totalWeight; // Total NFTs weight
    uint public lastWithdrawBlock; // Block of the last withdrawal

    uint public stakedAmount; // Amount sent to stake
    uint public pendingStake; // Amount pending to be sent to stake
    uint public currentYield; // Current month yield
    uint public pendingYield; // Yield pending to redeem
    uint public unclaimedYield; // Unclaimed yield. Available to be sent to charity
    address public charityAddress; // Charity address that will receive the unclaimed yield
    uint public totalSentToCharity; // Total amount sent to charity


    // Events
    event DnaGenerated(address indexed sender, string dna);
    event Minted(uint newId, address indexed owner, string imageURI, string metadataURI, string dna, bool isSpecial, uint weight);
    event Staked(uint pendingStake, uint stakedAmount);
    event Withdrawn(uint withdrawal);
    event SentToCharity(uint amount);

    /**
     @notice Contract constructor method.
     @param _nftAddress - NFT contract address.
     @param _maxSupply - Maximum NFT supply.
     @param _mintingPrice - NFT initial minting price.
     @param _stakingAdapterAddress - Staking adapter contract address.
     @param _charityAddress - Charity address that will receive the unclaimed yield.
     */
    constructor(address _nftAddress, uint _maxSupply, uint _mintingPrice, address _stakingAdapterAddress, address _charityAddress) Ownable() {
        nft = IPlasmids(_nftAddress);
        stakingAdapter = IStakingAdapter(_stakingAdapterAddress);
        maxSupply = _maxSupply;
        mintingPrice = _mintingPrice;
        specialProbability = 50;
        lastWithdrawBlock = block.number;
        charityAddress = _charityAddress;

        // Initializing attribute values
        attributes.push(10); // First attribute has 10 different values
        attributes.push(4);
        attributes.push(2);
    }

    // Public methods

    /**
     @notice Generates a new unique random DNA.
     */
    function getRandomDna() public {
        require(nft.totalSupply() < maxSupply, 'Max supply has been reached');

        // Getting a random DNA string
        uint seed = 0;
        string memory dna = _getRandomDna(seed);

        // Verifying DNA uniqueness (Must refactor)
        while (dnas[dna]) {
            seed += 1;
            dna = _getRandomDna(seed);
        }

        // Storing next DNA to be minted
        nextDna[msg.sender] = dna;

        // Emiting event
        emit DnaGenerated(msg.sender, dna);
    }

    /**
     @notice Function used to mint a new NFT.
     @param _imageURI - Link to an image referencing the asset.
     @param _metadataURI - Link to metadata.
     */
    function mintNFT(string memory _imageURI, string memory _metadataURI) external payable nonReentrant {
        require(msg.value == mintingPrice, 'Price is not correct');
        require(nft.totalSupply() < maxSupply, 'Max supply has been reached');

        // Getting generated DNA
        string memory dna = nextDna[msg.sender];
        require(bytes(dna).length > 0, 'Should generate a random DNA before minting');

        // Calculating special parameter and weight
        (bool isSpecial, uint weight) = _calculateSpecial();

        // Minting NFT
        uint newId = nft.mint(msg.sender, dna, _imageURI, _metadataURI, isSpecial, weight);
        if (isSpecial) {
            NFT memory nft = NFT({
                id: newId,
                initialWeight: weight,
                weight: weight,
                startingBlock: block.number
            });
            _addNftToUserInfo(msg.sender, nft);
        }

        // Cleaning next DNA for this sender
        nextDna[msg.sender] = '';
        dnas[dna] = true;

        // Updating balance
        pendingStake += msg.value;

        // Emiting event
        emit Minted(newId, msg.sender, _imageURI, _metadataURI, dna, isSpecial, weight);
    }

    /**
     @notice Gets the amount pending to redeem for a particular user.
     @param _addr - User address.
     */
    function pendingToRedeem(address _addr) public view returns(uint) {
        uint amount;
        if (users[_addr].exists && users[_addr].lastRedeemBlock < lastWithdrawBlock){
            amount = currentYield * users[_addr].userWeight / totalWeight;
        }
        return amount;
    }

    /**
     @notice Method used for users to redeem monthly available yield.
     @dev Yield cannot be withdrawn if it was already been redeemed or if there's not enough yield.
     */
    function redeem() external nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.lastRedeemBlock < lastWithdrawBlock, 'Yield already redeemed');
        require(user.userWeight > 0, 'Not enough NFT weight to redeem');

        // Getting amount pending to redeem
        uint pending = pendingToRedeem(msg.sender);
        require(pending > 0, 'You do not have anything to redeem');
        
        user.lastRedeemBlock = block.number;
        pendingYield -= pending;

        // Transfering yield
        (bool success, ) = msg.sender.call{value: pending}("");
        require(success, "Transfer fees failed");

        // Increasing NFT weights
        _increaseWeights(msg.sender);
    }

    /**
     @notice Sending balance to staking pool.
     @dev Only contract's owner can execute this method.
     */
    function stake() external onlyOwner nonReentrant {
        _depositStaking(pendingStake);

        // Updating balance
        stakedAmount += pendingStake;
        
        // Emiting event
        emit Staked(pendingStake, stakedAmount);
        pendingStake = 0;
    }

    /**
     @notice Withdrawing yield generated by the staking adapter.
     @dev This will add the unclaimed yield and reset the yield to be redeemed. Only owner can execute this method.
     */
    function withdraw() external onlyOwner nonReentrant {
        // Calling the staking adapter to withdraw the generated yield
        address[5] memory data = stakingAdapter.getWithdrawData();
        (bool success, bytes memory result) = address(stakingAdapter).delegatecall(
            abi.encodeWithSignature("withdraw(uint256,address[5])",stakedAmount, data)
        );
        require(success, "Staking withdraw failed");

        uint withdrawal = abi.decode(result, (uint256));
        
        // Updating balances
        currentYield += withdrawal;
        unclaimedYield += pendingYield;
        pendingYield += currentYield;
        lastWithdrawBlock = block.number;
        
        // Emiting event
        emit Withdrawn(withdrawal);
    }    

    /**
     @notice Method used to send unclaimed yield to charity.
     @dev Only owner can call this method.
     */
    function sendToCharity() external onlyOwner nonReentrant {
        require(unclaimedYield > 0, 'Not enough unclaimed yield to be sent');
        uint amount = unclaimedYield;
        unclaimedYield = 0;
        totalSentToCharity += amount;

        // Transfering yield
        (bool success, ) = payable(charityAddress).call{value: amount}("");
        require(success, "Transfer fees failed");

        // Emiting event
        emit SentToCharity(amount);
    }

    /**
     @notice Method used to change NFT owner before a ERC721 transfer.
     @dev This method must be called from the NFT contract before a transfer.
     @param _oldOwner - User who is transfering the NFT.
     @param _newOwner - User who is receiving the NFT.
     @param _tokenId - Token identifier.
     */
    function changeNFTOwner(address _oldOwner, address _newOwner, uint _tokenId) public onlyNFT {
        // Removing NFT from old owner collection
        uint initialWeight = _removeNftFromUserInfo(_oldOwner, _tokenId);

        // Adding the NFT to new owner collection
        NFT memory nft = NFT({
            id: _tokenId,
            initialWeight: initialWeight,
            weight: initialWeight,
            startingBlock: block.number
        });
        _addNftToUserInfo(_newOwner, nft);
    }

    /**
     @notice Method used to get contract's balance.
     */
    function getBalance() external view returns(uint) {
        return address(this).balance;
    }

    /**
     @notice Modifying max NFT supply.
     @param _maxSupply - New max suuply. Cannot be less than current supply.
     */
    function setMaxSupply(uint _maxSupply) external onlyOwner {
        require(_maxSupply >= nft.totalSupply(), 'Max supply cannot be less than current supply');
        maxSupply = _maxSupply;
    }

    /**
     @notice Modifying NFT minting price.
     @param _mintingPrice - New minting price.
     */
    function setMintingPrice(uint _mintingPrice) external onlyOwner {
        mintingPrice = _mintingPrice;
    }

    /**
     @notice Modifying special probability.
     @param _specialProbability - New special probability.
     @dev Probability should be between 0 - 100.
     */
    function setSpecialProbability(uint _specialProbability) external onlyOwner {
        require(_specialProbability >=0 && _specialProbability <= 100, 'Probability should be between 0 - 100');
        specialProbability = _specialProbability;
    }

    /**
     @notice Method used to receive ETH
     */
    receive() external payable {}

    // Private methods

    /**
     @notice Generates a new unique random DNA.
     @param _seed - Seed parameter.
     */
    function _getRandomDna(uint _seed) internal view returns(string memory) {
        string memory dna;
        for (uint256 i = 0; i < attributes.length; i++) {
            uint value = _getRandomAttributeValue(attributes[i], _seed);
            string memory formattedValue = _formatAttributeValue(value);
            dna = string(abi.encodePacked(dna, formattedValue));
        }
        return dna;
    }

    /**
     @notice Returns a random attribute value to build the DNA.
     @param _numberOfValues - Number of possible values for this attribute.
     @param _seed - Seed parameter.
     */
    function _getRandomAttributeValue(uint _numberOfValues, uint _seed) internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, block.number, _seed))) % _numberOfValues;
    }

    /**
     @notice Method used to format values with 2 digits.
     @param _value - Generated value to be formatted.
     */
    function _formatAttributeValue(uint _value) internal pure returns(string memory) {
        if(_value >= 10)
            return Strings.toString(_value);
        else
            return string(abi.encodePacked("0", Strings.toString(_value)));
    }

    /**
     @notice Calculates special parameter and rewards weight.
     @return isSpecial and weight.
     */
    function _calculateSpecial() internal view returns(bool, uint) {
        // Calculating special attribute
        uint rand = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, block.number))) % 100;
        bool isSpecial = rand <= specialProbability;

        // Calculating special weight
        uint weight = 0;
        if (isSpecial) {
            weight = (uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, block.number))) % (maxInitialWeight-1)) + 1;
        }

        return (isSpecial, weight);
    }

    /**
     @notice Method used to deposit an amount into staking pool.
     @param _amount - Amount to be sent to stake.
     */
    function _depositStaking(uint _amount) private {
        // Must approve to spend tokens to be able to withdraw deposit later on
        (address token, address spender) = stakingAdapter.getApprovalData();
        if (spender != address(0)){
            IERC20(token).approve(spender, type(uint256).max);
        }

        // Launching Staking        
        address[5] memory data = stakingAdapter.getWithdrawData();
        (bool success, bytes memory result) = address(stakingAdapter).delegatecall(
            abi.encodeWithSignature("deposit(uint256,address[5])", _amount, data)
        );
        require(success, "Staking deposit failed");
    }

    /**
     @notice Method used to add a new NFT to user info.
     @param _addr - Owner address.
     @param _nft - NFT item.
     */
    function _addNftToUserInfo(address _addr, NFT memory _nft) internal {
        UserInfo storage user = users[_addr];
        user.exists = true;
        user.lastRedeemBlock = block.number;
        user.userWeight += _nft.weight;        
        user.nfts.push(_nft);

        totalWeight += _nft.weight;
    }

        /**
     @notice Method used to remove an NFT from user info.
     @param _addr - Old owner address.
     @param _tokenId - NFT identifier.
     */
    function _removeNftFromUserInfo(address _addr, uint _tokenId) internal returns (uint) {
        UserInfo storage user = users[_addr];
        
        uint weightLost;
        uint initialWeight;
        for (uint i=0; i < user.nfts.length; i++) {
            if (user.nfts[i].id == _tokenId) {
                initialWeight = user.nfts[i].initialWeight;
                weightLost = user.nfts[i].weight;
                delete user.nfts[i];
            }

            user.userWeight -= weightLost;
        }
        return initialWeight;
    }

    /**
     @notice Method used to increase special NFT weights after redeeming.
     @param _addr - Owner address.
     */
    function _increaseWeights(address _addr) internal {
        UserInfo storage user = users[_addr];

        uint totalIncrement;
        for (uint i=0; i < user.nfts.length; i++) {
            user.nfts[i].weight += weightIncrement;
            totalIncrement += weightIncrement;
        }
        user.userWeight += totalIncrement;
        totalWeight += totalIncrement;
    }

    // Modifiers

    modifier onlyNFT() {
        require(msg.sender == address(nft), 'Caller is not the NFT contract');
        _;
    }

}


// Se hace un withdraw cada mes. Los usuarios con nft especiales pueden retirar su parte cada mes antes que se haga el siguiente withdraw.
// Poner 'require' en el withdraw. No se puede realizar antes de que pase un mes desde el anterior.

// El yield (unclaimed) que no se haya retirado a tiempo se enviará a caridad.

// Al hacer un mint se añade el nuevo nft a UserInfo del usuario y se recalculan los pesos. Una opción es hacer un redeem automático al hacer mint.
// Otra opción sería sumar el peso del nuevo nft siempre que el bloque del nft sea menor al bloque del withdraw.

// Al hacer redeem se debe guardar el bloque y transferimos el pago. Solo se permite hacer redeem si el bloque del último redeem es menor que el bloque del withdraw.

// Los nft irán incrementando su peso en 10 cada vez que se haga un redeem. 
// El recalculo del peso del user y del peso de los NFT se realizará al hacer un redeem.
// El weight total del usuario será igual a la suma de los pesos de sus nft
// --> Cuando se transfiera un nft se recalcularán los pesos restando el peso del nft transferido. El nuevo owner tendrá un nft con el peso por defecto.

// Al transferir un NFT, se debe guardar la info del user y del nft en "users" y actualizar la info del owner anterior.

/**
Tests:
-> Redeem con un solo nft
- Cannot redeem if I don't have nfts or I have nfts not special or with weight 0.
- No se puede hacer redeem si no se ha hecho un primer withdraw o el yield es 0.
-> No se puede hacer un redeem si se ha hecho ya previamente en el mes actual.
 */


 /**
 Pending:
 - Method to withdraw all.
 - Method to change charity address.
  */
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IPlasmids.sol";
// import "./interfaces/IPlasmidsFactory.sol";
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
        bool isSpecial;
    }

    struct UserInfo {
        uint numNfts;
        uint numSpecialNfts;
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
        attributes.push(7); // First attribute has 7 different values
        attributes.push(5);
        attributes.push(3);
        attributes.push(3);
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
        NFT memory nft = NFT({
            id: newId,
            initialWeight: weight,
            weight: weight,
            startingBlock: block.number,
            isSpecial: isSpecial
        });
        _addNftToUserInfo(msg.sender, nft);

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
        if (users[_addr].exists && users[_addr].userWeight > 0){
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
        if(_oldOwner != address(0)) {
            // Removing NFT from old owner collection
            (uint initialWeight, bool isSpecial) = _removeNftFromUserInfo(_oldOwner, _tokenId);

            // Adding the NFT to new owner collection
            NFT memory nft = NFT({
                id: _tokenId,
                initialWeight: initialWeight,
                weight: initialWeight,
                startingBlock: block.number,
                isSpecial: isSpecial
            });

            _addNftToUserInfo(_newOwner, nft);
        }
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
     @notice Modifying charity address.
     @param _addr - New charity address.
     */
    function setCharityAddress(address _addr) external onlyOwner {
        require(_addr != address(0), 'Address is incorrect');
        charityAddress = _addr;
    }

    /**
     @notice Method that returns user info all at once.
     @return mintingPrice, maxSupply, totalSupply, stakedAmount, currentYield.
     */
    function getFactoryInfo() external view returns (uint, uint, uint, uint, uint) {
        return (
            mintingPrice,
            maxSupply,
            nft.totalSupply(),
            stakedAmount,
            currentYield
        );
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
        user.numNfts += 1;
        console.log("inc", user.numNfts);
        totalWeight += _nft.weight;
        
        if (_nft.isSpecial)
            user.numSpecialNfts += 1;
    }

        /**
     @notice Method used to remove an NFT from user info.
     @param _addr - Old owner address.
     @param _tokenId - NFT identifier.
     */
    function _removeNftFromUserInfo(address _addr, uint _tokenId) internal returns (uint, bool) {
        UserInfo storage user = users[_addr];
        
        uint weightLost;
        uint initialWeight;
        bool isSpecial = false;
        for (uint i=0; i < user.nfts.length; i++) {
            if (user.nfts[i].id == _tokenId) {
                initialWeight = user.nfts[i].initialWeight;
                weightLost = user.nfts[i].weight;
                isSpecial = user.nfts[i].isSpecial;
                delete user.nfts[i];
            }

            user.userWeight -= weightLost;
            user.numNfts -= 1;
            if(isSpecial)
                user.numSpecialNfts -= 1;
        }
        return (initialWeight, isSpecial);
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
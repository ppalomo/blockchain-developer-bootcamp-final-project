//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/// @title LotteryPoolFactory interface
interface IStakingAdapter {

    function deposit(uint256 _amount, address[5] memory _data) external;

    function withdraw(uint256 _amount, address[5] memory _data) external returns(uint);

    function getApprovalData() external returns(address, address);

    function getWithdrawData() external returns(address[5] memory);

    function getStakedAmount(address _addr) external view returns (uint);

    function getAllowance(address _addr) external view returns (uint);

    function name() external pure returns(bytes32);
    
}
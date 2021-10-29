# Avoiding Common Attacks

1) **Using Specific Compiler Pragma**

I'm using the solidity 0.8.0 version.

2) **Proper Use of Require, Assert and Revert**

I'm using require to secure the methods.

3) **Use Modifiers Only for Validation**

I'm using some modifiers like onlyNFT, onlyFactory, nonReentrant, onlyOwner to validate calls.

4) **Pull Over Push**

The contracts flow is designed to let the users and the owner call the contracts when needed decreasing the number of calls from the contracts.

5) **Re-entrancy**

we're avoiding re-entrancy attacks by using the library ReentrancyGuard from Openzeppelin. I use the modifier nonReentrant in the methods that make external calls.

6) **Proper use of .call and .delegateCall**

I'm using delegatecall when calling the AAVE adapter contract.
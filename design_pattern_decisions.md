# Design Pattern Decisions

1) **Inter-Contract Execution**

The factory contract executes methods from the AAVE adapter contract (Stake and Withdraw with DelegateCall) and the Plasmids contracts (Mint).
The Plasmids contract is executing a method from the factory before transfering a token.

2) **Inheritance and Interfaces**

The Plasmids contract inherits from ERC721, Ownable, etc. and the factory contract also inherits from Ownable and ReentrancyGuard.
I'm using interfaces as well to communicate the contracts.

3) **Access Control Design Patterns**

Both the Factory and the ERC721 contracts are **Ownable**. Both contracts have methods that only the owner can execute like staking, withdrawal and other configuration functions.
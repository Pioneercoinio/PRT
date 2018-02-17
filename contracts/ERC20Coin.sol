pragma solidity ^0.4.19;

/// @title General ERC20Coin.
/// @author frods
contract ERC20Coin
{
    string public name;
    string public symbol;
    // 18 decimals is the strongly suggested default, avoid changing it
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping (address => uint256) private balances;

    address private owner;

    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract
     */
    function ERC20Coin(
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 initialSupply
    ) public {
        totalSupply = initialSupply * 10 ** uint256(_decimals); // Update total supply with the decimal amount
        balances[msg.sender] = totalSupply;                     // Give the creator all initial tokens
        name = _name;                                           // Set the name for display purposes
        symbol = _symbol;                                       // Set the symbol for display purposes
        decimals = _decimals;                                   // Set the number of decimals supported
        owner = msg.sender;                                     // Store the creator
    }

    /// @notice Query balance for an account
    /// @param _owner The address to query
    function balanceOf(address _owner) public returns (uint256) {
        return balances[_owner];
    }

    /// @notice Mint valueInmCoin Coin and add it to the owners account
    /// @param valueInmCoin The ERC20Coin value to mint
    function mint(uint256 valueInmCoin) {
        require(msg.sender == owner);
        balances[owner] += valueInmCoin;
        totalSupply += valueInmCoin;
    }

    /// @notice Transfer `(valueInmCoin / 1000).fixed(0,3)` Coin from the account of 
    /// `message.caller.address()`, to an account accessible only by `to.address()
    /// @dev This should be the documentation of the function for the developer docs
    /// @param to The address of the recipient of the ERC20Coin
    /// @param valueInmCoin The ERC20Coin value to send
    function transfer(address to, uint256 valueInmCoin) {
        require(balances[msg.sender] >= valueInmCoin);
        balances[to] += valueInmCoin;
        balances[msg.sender] -= valueInmCoin;
        Transfer(msg.sender, to, valueInmCoin);
    }
}

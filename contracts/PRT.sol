pragma solidity ^0.4.24;

/// @title General PRT.
/// @author frods


contract PRT {
  string public name = "Pioneer Reputation Token";
  string public symbol = "PRT";
  // 18 decimals is the strongly suggested default, avoid changing it
  uint8 public decimals = 18;
  uint256 public totalSupply;
  mapping (address => uint256) private balances;
  mapping (address => mapping (address => uint256)) private allowed;


  address private owner;

  // This generates a public event on the blockchain that will notify clients
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  /**
   * Constructor function
   *
   * Initializes contract with initial supply tokens to the creator of the contract
   */
  constructor() public {
    uint256 initialSupply = 230000;
    totalSupply = initialSupply * 10 ** uint256(decimals); // Update total supply with the decimal amount
    balances[msg.sender] = totalSupply;                     // Give the creator all initial tokens
    owner = msg.sender;                                     // Store the creator
  }

  /// @notice Query balance for an account
  /// @param _owner The address to query
  function balanceOf(address _owner) public view returns (uint256) {
    return balances[_owner];
  }

  /// @notice Transfer `(valueInmCoin / 1000).fixed(0,3)` Coin from the account of 
  /// `message.caller.address()`, to an account accessible only by `to.address()
  /// @dev This should be the documentation of the function for the developer docs
  /// @param _to The address of the recipient of the PRT
  /// @param valueInmCoin The PRT value to send
  function transfer(address _to, uint256 valueInmCoin) public {
    require(balances[msg.sender] >= valueInmCoin, "Insufficient balance");
    balances[_to] += valueInmCoin;
    balances[msg.sender] -= valueInmCoin;
    emit Transfer(msg.sender, _to, valueInmCoin);
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    require(allowed[_from][msg.sender] >= _value, "Not allowed to transfer value");
    require(balances[_from] >= _value, "Insufficient balance");
    allowed[_from][msg.sender] -= _value;
    balances[_to] += _value;
    balances[_from] -= _value;
    emit Transfer(_from, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool success) {
    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender,0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require((_value == 0) || (allowed[msg.sender][_spender] == 0), "Can't approve nonzero value");

    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;        
  }

  function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }
}

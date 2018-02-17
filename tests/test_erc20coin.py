'''
Validate that ERC20Coin.sol performs as expected.

Roughy validates that the contract conforms to ERC20 
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
'''

import pytest
import ethereum

NAME = 'ERC20 Coin'
SYMBOL = 'ERC20'
DECIMALS = 18
TOTAL_SUPPLY = 1000
TOTAL_SUPPLY_MCOIN = 1000 * 10**DECIMALS


@pytest.fixture
def contract(chain):
    contract, _ = chain.provider.get_or_deploy_contract(
        'ERC20Coin', deploy_args=(NAME, SYMBOL, DECIMALS, TOTAL_SUPPLY))
    return contract


def validate_contract_state( #pylint: disable=invalid-name
        # Arguments are named after the contract accessor methods
        contract,
        name=NAME,
        symbol=SYMBOL,
        decimals=DECIMALS,
        totalSupply=TOTAL_SUPPLY_MCOIN,
        balances=None):
    '''
    Validate contract state using accessor methods.

    Default arguments validate the default contract values

    balanances: a list if tuples specifying address, value for each balance to be checked
    '''
    balances = balances or None
    assert contract.call().name() == name
    assert contract.call().symbol() == symbol
    assert contract.call().decimals() == decimals
    assert contract.call().totalSupply() == totalSupply
    for address, value in balances:
        assert contract.call().balanceOf(address) == value

def validate_events(events, expected=None):
    '''
    Validate given events

    expected: list of dictionaries specifying events. Only supplied keys are checked so
        only a subset of the full event need be specified.
    '''
    expected = expected or []
    assert len(events) == len(expected)
    for index, target in enumerate(expected):
        event = events[index]
        for key, value in iter(target.items()):
            assert event[key] == value


def test_create(contract, web3):
    validate_contract_state(contract, balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN)])


def test_valid_transfer(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    transaction_ammount = 1000

    transfer_txn_hash = contract.transact().transfer(other_account, transaction_ammount)
    txn_result = chain.wait.for_receipt(transfer_txn_hash)

    assert txn_result.gasUsed == 51061
    validate_contract_state(
        contract,
        balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN - transaction_ammount),
                  (other_account, transaction_ammount)])

    transfer_filter = contract.on('Transfer')
    events = transfer_filter.get()

    validate_events(
        events, [
            {'event': 'Transfer',
             'args': {
                 'from': web3.eth.coinbase,
                 'to': other_account,
                 'value': transaction_ammount
                 }
            }
        ]
    )


def test_zero_transfer(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    transaction_ammount = 0

    transfer_txn_hash = contract.transact().transfer(other_account, transaction_ammount)
    txn_result = chain.wait.for_receipt(transfer_txn_hash)

    assert txn_result.gasUsed == 35933
    validate_contract_state(
        contract,
        balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN - transaction_ammount),
                  (other_account, transaction_ammount)])

    transfer_filter = contract.on('Transfer')
    events = transfer_filter.get()

    validate_events(
        events, [
            {'event': 'Transfer',
             'args': {
                 'from': web3.eth.coinbase,
                 'to': other_account,
                 'value': transaction_ammount
                 }
            }
        ]
    )



def test_invalid_transfer(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    transaction_ammount = TOTAL_SUPPLY_MCOIN + 1
    with pytest.raises(ethereum.tester.TransactionFailed):
        contract.transact().transfer(other_account, transaction_ammount)

    validate_contract_state(
        contract,
        balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN),
                  (other_account, 0)])

    transfer_filter = contract.on('Transfer')
    events = transfer_filter.get()

    validate_events(events)


def test_mint_coins(contract, chain, web3):
    mint_ammount = 1000

    mint_txn_hash = contract.transact().mint(mint_ammount)
    txn_result = chain.wait.for_receipt(mint_txn_hash)

    assert txn_result.gasUsed == 32870
    validate_contract_state(
        contract,
        totalSupply=TOTAL_SUPPLY_MCOIN + mint_ammount,
        balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN + mint_ammount)])


def test_only_owner_can_mint_coins(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    # Ensure other_account has some ether
    transfer_hash = web3.eth.sendTransaction(
        {"from": web3.eth.coinbase, "to": other_account, "value": 100})
    chain.wait.for_receipt(transfer_hash)
    mint_ammount = 1000

    with pytest.raises(ethereum.tester.TransactionFailed):
        contract.transact({"from": other_account}).mint(mint_ammount)

    validate_contract_state(
        contract,
        balances=[(web3.eth.coinbase, TOTAL_SUPPLY_MCOIN),
                  (other_account, 0)])

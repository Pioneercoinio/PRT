'''
Validate that PRT.sol performs as expected.

Roughy validates that the contract conforms to ERC20 
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
'''

import pytest
import ethereum

NAME = 'Pioneer Reputation Token'
SYMBOL = 'PRT'
DECIMALS = 18
INITIAL_SUPPLY = 230000
TOTAL_SUPPLY_MCOIN = INITIAL_SUPPLY * 10**DECIMALS


@pytest.fixture
def contract(chain):
    contract, _ = chain.provider.get_or_deploy_contract('PRT')
    return contract


def validate_contract_state( #pylint: disable=invalid-name
        # Arguments are named after the contract accessor methods
        contract,
        name=NAME,
        symbol=SYMBOL,
        decimals=DECIMALS,
        totalSupply=TOTAL_SUPPLY_MCOIN,
        balances=None,
        allowed=None):
    '''
    Validate contract state using accessor methods.

    Default arguments validate the default contract values

    balances: a list if tuples specifying address, value for each balance to be checked
    allowed: a list of tuples specifying owner, [(spender, ammount)...] for each allowance to be checked
    '''
    assert contract.call().name() == name
    assert contract.call().symbol() == symbol
    assert contract.call().decimals() == decimals
    assert contract.call().totalSupply() == totalSupply
    balances = balances or []
    for address, value in balances:
        assert contract.call().balanceOf(address) == value
    allowed = allowed or []
    for owner, allowances in allowed:
        for spender, ammount in allowances:
            assert contract.call().allowance(owner, spender) == ammount

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

    assert txn_result.gasUsed == 51116
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

    assert txn_result.gasUsed == 35988
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

def test_approve(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    ammount = 10;
    approve_txn_hash = contract.transact().approve(other_account, ammount)
    txn_result = chain.wait.for_receipt(approve_txn_hash)

    assert txn_result.gasUsed == 45661
    validate_contract_state(
        contract,
        allowed=[(web3.eth.coinbase, [(other_account, ammount)])])

    approval_filter = contract.on('Approval')
    events = approval_filter.get()

    validate_events(
        events, [
            {'event': 'Approval',
             'args': {
                 'owner': web3.eth.coinbase,
                 'spender': other_account,
                 'value': ammount
                 }
            }
        ]
    )

def test_approve_non_zero(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    ammount = 10;
    approve_txn_hash = contract.transact().approve(other_account, ammount)
    txn_result = chain.wait.for_receipt(approve_txn_hash)

    with pytest.raises(ethereum.tester.TransactionFailed):
        contract.transact().approve(other_account, ammount)

    validate_contract_state(
        contract,
        allowed=[(web3.eth.coinbase, [(other_account, ammount)])])

    approval_filter = contract.on('Approval')
    events = approval_filter.get()

    validate_events(
        events, [
            {'event': 'Approval',
             'args': {
                 'owner': web3.eth.coinbase,
                 'spender': other_account,
                 'value': ammount
                 }
            }
        ]
    )


def test_approve_zero_first(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    ammount = 10;
    approve_txn_hash = contract.transact().approve(other_account, ammount)
    txn_result = chain.wait.for_receipt(approve_txn_hash)

    approve_txn_hash = contract.transact().approve(other_account, 0)
    txn_result = chain.wait.for_receipt(approve_txn_hash)

    approve_txn_hash = contract.transact().approve(other_account, ammount)
    txn_result = chain.wait.for_receipt(approve_txn_hash)

    validate_contract_state(
        contract,
        allowed=[(web3.eth.coinbase, [(other_account, ammount)])])

    approval_filter = contract.on('Approval')
    events = approval_filter.get()

    validate_events(
        events, [
            {'event': 'Approval',
             'args': {
                 'owner': web3.eth.coinbase,
                 'spender': other_account,
                 'value': ammount
                 }
            },
            {'event': 'Approval',
             'args': {
                 'owner': web3.eth.coinbase,
                 'spender': other_account,
                 'value': 0
                 }
            },
            {'event': 'Approval',
             'args': {
                 'owner': web3.eth.coinbase,
                 'spender': other_account,
                 'value': ammount
                 }
            }

        ]
    )

def test_transferFrom_not_allowed(contract, chain, web3):
    other_account = web3.eth.accounts[1]
    dest_account = web3.eth.accounts[2]
    ammount = 10;
    with pytest.raises(ethereum.tester.TransactionFailed):
        contract.transact().transferFrom(other_account, dest_account, ammount)

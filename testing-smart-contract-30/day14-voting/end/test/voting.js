const Voting = artifacts.require('Voting');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

contract('Voting', (accounts) => {
  let voting = null;
  const admin = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const nonVoter = accounts[4];
  before(async () => {
    voting = await Voting.deployed();
  });

  it('should add voters', async () => {
    await voting.addVoters([voter1, voter2, voter3], {from: admin});
    const result1 = await voting.voters(voter1);
    const result2 = await voting.voters(voter2);
    const result3 = await voting.voters(voter3);
    assert(result1 === true);
    assert(result2 === true);
    assert(result3 === true);
  });

  it('should create ballot', async () => {
    await voting.createBallot(
      'ballot1',
      ['choice1', 'choice2', 'choice3'], 
      5, 
      {from: admin}
    );
    //ballots mapping is not public, we cant check that ballot was actually created :(
  });

  it('should NOT let non-admin create ballot', async () => {
    try {
      await voting.createBallot(
        'Ballot2',
        ['choice1', 'choice2', 'choice3'], 
        10, 
        {from: nonVoter}
      );
    } catch(e) {
      assert(e.message.includes('only admin'));
      return;
    }
    assert(false);
  });

  it('should NOT let non-voters vote', async () => {
    await voting.createBallot(
      'Ballot2',
      ['choice1', 'choice2', 'choice3'], 
      10, 
      {from: admin}
    );
    try {
      await voting.vote(1, 1, {from: nonVoter});
    } catch(e) {
      assert(e.message.includes('only voters can vote'));
      return;
    }
    assert(false);
  });

  it('should NOT let voters vote after end of ballot', async () => {
    await voting.createBallot(
      'Ballot3',
      ['choice1', 'choice2', 'choice3'], 
      1, 
      {from: admin}
    );
    try {
      await sleep(1001);
      await voting.vote(2, 1, {from: voter1});
    } catch(e) {
      assert(e.message.includes('can only vote until ballot end date'));
      return;
    }
    assert(false);
  });

  it('should NOT let voters vote twice', async () => {
    await voting.createBallot(
      'Ballot4',
      ['choice1', 'choice2', 'choice3'], 
      2, 
      {from: admin}
    );
    try {
      await voting.vote(3, 1, {from: voter1});
      await voting.vote(3, 1, {from: voter1});
    } catch(e) {
      assert(e.message.includes('voter can only vote once for a ballot'));
      return;
    }
    assert(false);
  });

  it('should vote', async () => {
    await voting.createBallot(
      'Ballot5',
      ['choice1', 'choice2', 'choice3'], 
      2, 
      {from: admin}
    );
    await voting.vote(4, 1, {from: voter1});
    await voting.vote(4, 1, {from: voter2});
    await voting.vote(4, 2, {from: voter3});
    await sleep(2001);
    const result = await voting.results(4);
    assert(result[1].votes === '2');
    assert(result[2].votes === '1');
  });
});
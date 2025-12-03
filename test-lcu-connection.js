// Test LCU connection and player detection
const fs = require('fs');
const path = require('path');
const https = require('https');

// Try to find League Client lockfile
function findLeagueClientCredentials() {
  const possiblePaths = [
    'C:\\Riot Games\\League of Legends\\lockfile',
    'D:\\Riot Games\\League of Legends\\lockfile',
    path.join(process.env.LOCALAPPDATA || '', 'Riot Games', 'League of Legends', 'lockfile'),
  ];

  for (const lockfilePath of possiblePaths) {
    if (fs.existsSync(lockfilePath)) {
      const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
      const parts = lockfileContent.split(':');

      if (parts.length >= 4) {
        return {
          port: parts[2],
          token: parts[3],
          processName: parts[0]
        };
      }
    }
  }

  return null;
}

async function makeRequest(credentials, endpoint) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`riot:${credentials.token}`).toString('base64');

    const options = {
      hostname: '127.0.0.1',
      port: credentials.port,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function test() {
  console.log('=== Testing LCU Connection ===\n');

  const credentials = findLeagueClientCredentials();

  if (!credentials) {
    console.log('❌ League Client is NOT running');
    console.log('   Please start League of Legends and try again.');
    return;
  }

  console.log('✓ League Client detected');
  console.log(`  Port: ${credentials.port}`);
  console.log(`  Process: ${credentials.processName}`);

  try {
    // Test 1: Get current summoner
    console.log('\n--- Test 1: Current Summoner ---');
    const summoner = await makeRequest(credentials, '/lol-summoner/v1/current-summoner');
    if (summoner) {
      console.log(`✓ Logged in as: ${summoner.gameName}#${summoner.tagLine}`);
      console.log(`  PUUID: ${summoner.puuid}`);
      console.log(`  Level: ${summoner.summonerLevel}`);
    } else {
      console.log('⚠️  Not logged in');
    }

    // Test 2: Get gameflow state
    console.log('\n--- Test 2: Gameflow State ---');
    const gameflow = await makeRequest(credentials, '/lol-gameflow/v1/session');
    if (gameflow) {
      console.log(`✓ Gameflow phase: ${gameflow.phase}`);
      const queueId = gameflow.queue?.id || gameflow.gameData?.queue?.id;
      if (queueId) {
        console.log(`  Queue ID: ${queueId}`);
      }
    } else {
      console.log('  No active game session');
    }

    // Test 3: Check for champ select
    console.log('\n--- Test 3: Champion Select ---');
    const champSelect = await makeRequest(credentials, '/lol-champ-select/v1/session');
    if (champSelect && (champSelect.myTeam || champSelect.theirTeam)) {
      console.log(`✓ In champion select!`);
      const allPlayers = [...(champSelect.myTeam || []), ...(champSelect.theirTeam || [])];
      console.log(`  Total players: ${allPlayers.length}`);

      console.log('\n  Players in lobby:');
      for (const player of allPlayers) {
        // Try to get summoner info
        let summonerInfo = null;
        if (player.summonerId) {
          try {
            summonerInfo = await makeRequest(credentials, `/lol-summoner/v1/summoners/${player.summonerId}`);
          } catch (err) {
            // Ignore
          }
        }

        const name = summonerInfo
          ? `${summonerInfo.gameName}#${summonerInfo.tagLine}`
          : player.displayName || player.summonerName || 'Unknown';

        console.log(`    - ${name} (Champion ID: ${player.championId || 'None'})`);
        console.log(`      PUUID: ${summonerInfo?.puuid || player.puuid || 'None'}`);
      }
    } else {
      console.log('  Not in champion select');
    }

    console.log('\n=== CONNECTION TEST COMPLETE ===');
    console.log('If you see players listed above and you\'re in a game,');
    console.log('then the LCU connection is working correctly.');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

test();

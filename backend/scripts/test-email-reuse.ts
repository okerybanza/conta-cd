import 'dotenv/config';
import accountDeletionService from '../src/services/account-deletion.service';

async function testEmailReuse() {
  const result = await accountDeletionService.canReuseEmail('okerytop11@gmail.com');
  console.log('📊 Résultat de canReuseEmail:', JSON.stringify(result, null, 2));
}

testEmailReuse()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

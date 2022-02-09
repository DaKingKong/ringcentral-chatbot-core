// @ts-ignore
import Sequelize from 'dynamo-sequelize'

let config;
if (process.env.USE_HEROKU_POSTGRES) {
  config =
  {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
}
else {
  config =
  {
    dialect: 'postgres',
    logging: console.log
  }
}

const sequelize = new Sequelize(
  process.env.RINGCENTRAL_CHATBOT_DATABASE_CONNECTION_URI,
  config
)

export default sequelize
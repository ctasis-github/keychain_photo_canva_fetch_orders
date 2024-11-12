const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    PORT: Joi.number().default(3000),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  amzSPAPI: {
    client_id: envVars.SELLING_PARTNER_APP_CLIENT_ID,
    client_secret: envVars.SELLING_PARTNER_APP_CLIENT_SECRET,
    region: envVars.AWS_REGION,
    seller_id: envVars.SELLING_PARTNER_APP_SELLER_ID,
    marketplace_id: envVars.SE_MARKETPLACE_ID,
    refresh_token: envVars.SELLING_PARTNER_APP_REFRESH_TOKEN,
    sp_api_endpoint: envVars.SP_API_ENDPOINT,
  },
};

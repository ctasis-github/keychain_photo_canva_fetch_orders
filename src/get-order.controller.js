const axios = require('axios');
const config = require('./config');
const moment = require('moment');
const { apiCallForAmazon } = require('./common.controller');
let accessToken = '',
  token_time_out = 1800000,
  auth_time = 0,
  is_script_running = false;
let storeBasedToken = '';
const qs = require('qs');

const getToken = async () => {
  // obtain token handler
  const token_data = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: config.amzSPAPI.refresh_token,
    client_secret: config.amzSPAPI.client_secret,
    client_id: config.amzSPAPI.client_id,
  });
  const TokenConfig = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.amazon.com/auth/o2/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: token_data,
  };
  try {
    const response = await axios.request(TokenConfig);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log(error && error?.response?.data ? error?.response?.data : error);
    return {};
  }
};

const amazonAuthorization = async () => {
  // grt auth token
  if (auth_time !== 0 && new Date().getTime() - auth_time <= token_time_out) {
    return;
  }
  const authResponse = await getToken();
  auth_time = new Date().getTime();
  accessToken = authResponse.access_token;
  return accessToken;
};

// Function to fetch orders for a store
const fetchFBMOrdersForStore = async (store) => {
  // get order list
  if (auth_time === 0 || new Date().getTime() - auth_time >= token_time_out) {
    storeBasedToken = await amazonAuthorization();
    store['accessToken'] = storeBasedToken;
  }

  const amazonOrdersList = await getFBMOrdersFromAmazon('Unshipped', store); //Pending,Shipped
  console.log('amazonOrdersList count : ', amazonOrdersList.length);
  if (amazonOrdersList.length < 1) {
    return { msg: 'Order not found!!' };
  }
};

async function getFBMOrdersFromAmazon(orderStatus, storeDetail) {
  // only for unshipped orders
  let currentDate = new Date();
  let previousDate = new Date(
    currentDate.setDate(currentDate.getDate() - 5) //past  days
  ).toISOString();
  try {
    const headers = {
      'x-amz-access-token': storeDetail['accessToken'],
    };
    const marketplace_id = config.amzSPAPI.marketplace_id;
    const url = `${config.amzSPAPI.sp_api_endpoint}/orders/v0/orders?OrderStatuses=Unshipped&FulfillmentChannels=MFN&MarketplaceIds=${marketplace_id}&LastUpdatedAfter=${previousDate}`;
    return await apiCallForAmazon('get', url, headers)
      .then((response) => {
        return response.payload.Orders;
      })
      .catch((error) => {
        console.error(
          'Failed to fetch orders:',
          error?.data ? error.data : error
        );
        return [];
      });
  } catch (e) {
    console.log('error from get order: #92', e);
    return [];
  }
}

const fetchAllOrdersFromAmazon = async () => {
  //main - enrty point
  console.log('fetchAllOrdersFromAmazon: ');
  console.log(
    'Script started for fetch order',
    is_script_running,
    moment().format('MMMM Do YYYY, h:mm:ss a')
  );
  if (is_script_running) {
    return;
  }
  is_script_running = true;
  const store = config.amzSPAPI;
  await fetchFBMOrdersForStore(store);
  is_script_running = false;
};

module.exports = {
  fetchAllOrdersFromAmazon,
};

const fs = require('fs/promises');

const axios = require('axios');
const path = require('path');

// Common function to make GET requests to Amazon API
const apiCallForAmazon = async (method, url, headers, data) => {
  try {
    const response = await axios({
      method: method,
      url: url,
      headers: headers,
      maxBodyLength: Infinity,
      data: data,
    });

    console.log(
      'response.data: response.data.payload.Orders',
      response.data.payload.Orders
    );

    const orders = response?.data?.payload?.Orders;

    if (Array.isArray(orders)) {
      for (const item of orders) {
        const folderName = item.AmazonOrderId;
        const folderPath = path.resolve(
          __dirname,
          '../uploads/orders',
          folderName
        );

        // Check if the folder exists, if not, create it
        try {
          await fs.access(folderPath);
        } catch (error) {
          await fs.mkdir(folderPath, { recursive: true }); //create folder
        }

        // Write the order.json file
        await fs.writeFile(
          path.resolve(folderPath, 'order.json'),
          JSON.stringify(item, null, 2) // added formatting for readability
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error(
      'Error in apiCallForAmazon:',
      error.response ? error.response.data : error.message
    );
    throw error.response ? error.response.data : error.message;
  }
};

module.exports = {
  apiCallForAmazon,
};

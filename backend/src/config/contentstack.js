import Contentstack from "contentstack-management";

const stackApiKey = process.env.CONTENTSTACK_API_KEY;
const managementToken = process.env.CONTENTSTACK_MANAGEMENT_TOKEN;

const client = Contentstack.client({ 
  region: process.env.CONTENTSTACK_REGION  // Optional, if you use regions
});

const stack = client.stack({
  api_key: stackApiKey,
  management_token: managementToken
});

export default stack;

const axios = require('axios');

class BrandkitService {
  constructor() {
    this.baseURL = 'https://api.contentstack.io/v1/brand-kit';
    this.authToken = null;
  }

  initialize(authToken) {
    this.authToken = authToken;
  }

  // Validate replacement term against brand guidelines
  async validateReplacement(brandKitId, term) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${brandKitId}/validate`,
        { term },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        isValid: response.data.approved,
        suggestions: response.data.suggestions || [],
        reason: response.data.reason
      };
    } catch (error) {
      console.error('Brandkit validation error:', error);
      // Fallback - assume valid if service is unavailable
      return { isValid: true, suggestions: [], reason: 'Service unavailable' };
    }
  }

  // Get brand-approved alternatives
  async getSuggestions(brandKitId, term) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${brandKitId}/suggestions?term=${encodeURIComponent(term)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting brandkit suggestions:', error);
      return [];
    }
  }

  // Check if term is banned
  async isBannedTerm(brandKitId, term) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${brandKitId}/banned-terms?term=${encodeURIComponent(term)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.isBanned || false;
    } catch (error) {
      console.error('Error checking banned terms:', error);
      return false;
    }
  }
}

module.exports = new BrandkitService();

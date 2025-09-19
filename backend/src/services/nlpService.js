const compromise = require('compromise');

class NLPService {
  constructor() {
    // Initialize NLP models
    this.initializeNER();
  }

  initializeNER() {
    // Initialize Named Entity Recognition
    this.entityTypes = {
      PERSON: ['person', 'people', 'name'],
      ORG: ['organization', 'company', 'corp'],
      EMAIL: ['email', 'mail'],
      URL: ['url', 'link', 'website'],
      PRODUCT: ['product', 'software', 'tool']
    };
  }

  // Context-aware replacement logic
  contextAwareReplace(text, findTerm, replaceTerm, context = {}) {
    const doc = compromise(text);
    
    // Handle version numbers specially
    if (this.isVersionedProduct(findTerm)) {
      return this.replaceVersionedProduct(text, findTerm, replaceTerm);
    }
    
    // Handle company/product names
    if (this.isCompanyName(findTerm)) {
      return this.replaceCompanyReferences(text, findTerm, replaceTerm);
    }
    
    // Default case-sensitive word boundary replacement
    const regex = new RegExp(`\\b${this.escapeRegex(findTerm)}\\b`, 'gi');
    return text.replace(regex, replaceTerm);
  }

  // Handle versioned products like "Gemini 2.5 Pro"
  replaceVersionedProduct(text, findTerm, replaceTerm) {
    // Extract product name without version
    const baseProduct = findTerm.replace(/\s+\d+(\.\d+)*\s*(pro|plus|premium|enterprise)?$/i, '');
    const versionMatch = findTerm.match(/\d+(\.\d+)*/);
    const editionMatch = findTerm.match(/(pro|plus|premium|enterprise)$/i);
    
    // Replace only the product name, preserve version structure
    let result = text;
    const regex = new RegExp(`\\b${this.escapeRegex(findTerm)}\\b`, 'gi');
    
    result = result.replace(regex, (match) => {
      if (versionMatch && editionMatch) {
        return `${replaceTerm} ${versionMatch[0]} ${editionMatch[1]}`;
      } else if (versionMatch) {
        return `${replaceTerm} ${versionMatch[0]}`;
      }
      return replaceTerm;
    });
    
    return result;
  }

  // Named Entity Recognition
  extractNamedEntities(text) {
    const doc = compromise(text);
    const entities = [];

    // Extract persons
    const people = doc.people().out('array');
    people.forEach(person => {
      entities.push({ text: person, type: 'PERSON', confidence: 0.9 });
    });

    // Extract organizations
    const orgs = doc.organizations().out('array');
    orgs.forEach(org => {
      entities.push({ text: org, type: 'ORG', confidence: 0.85 });
    });

    // Extract emails using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({ text: email, type: 'EMAIL', confidence: 0.95 });
    });

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
      entities.push({ text: url, type: 'URL', confidence: 0.95 });
    });

    return entities;
  }

  // Replace named entities consistently
  replaceNamedEntities(text, entityMapping) {
    let result = text;
    
    Object.entries(entityMapping).forEach(([oldEntity, newEntity]) => {
      // Handle different entity types
      if (this.isEmail(oldEntity)) {
        result = this.replaceEmail(result, oldEntity, newEntity);
      } else if (this.isURL(oldEntity)) {
        result = this.replaceURL(result, oldEntity, newEntity);
      } else {
        // General entity replacement
        const regex = new RegExp(`\\b${this.escapeRegex(oldEntity)}\\b`, 'gi');
        result = result.replace(regex, newEntity);
      }
    });

    return result;
  }

  // Helper methods
  isVersionedProduct(term) {
    return /\d+(\.\d+)*\s*(pro|plus|premium|enterprise)?$/i.test(term);
  }

  isCompanyName(term) {
    const companyIndicators = ['inc', 'corp', 'ltd', 'llc', 'company', 'corporation'];
    return companyIndicators.some(indicator => 
      term.toLowerCase().includes(indicator)
    );
  }

  isEmail(text) {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
  }

  isURL(text) {
    return /https?:\/\/[^\s<>"{}|\\^`[\]]+/.test(text);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  replaceEmail(text, oldEmail, newEmail) {
    const regex = new RegExp(`\\b${this.escapeRegex(oldEmail)}\\b`, 'gi');
    return text.replace(regex, newEmail);
  }

  replaceURL(text, oldURL, newURL) {
    const regex = new RegExp(this.escapeRegex(oldURL), 'gi');
    return text.replace(regex, newURL);
  }
}

module.exports = new NLPService();

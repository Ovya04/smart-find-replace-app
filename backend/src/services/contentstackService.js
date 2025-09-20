const contentstack = require('@contentstack/management');

class ContentstackService {
  constructor() {
    this.client = null;
    this.stack = null;
  }

  initialize(authtoken, apiKey) {
    this.client = contentstack.client({ authtoken });
    this.stack = this.client.stack({ api_key: apiKey });
  }

  // Fetch all entries for processing
  async fetchAllEntries(contentTypes = [], locale = 'en-us') {
    const allEntries = [];
    
    try {
      if (contentTypes.length === 0) {
        // Get all content types first
        const contentTypeResponse = await this.stack.contentType().query().find();
        contentTypes = contentTypeResponse.items.map(ct => ct.uid);
      }

      for (const contentType of contentTypes) {
        let skip = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const query = this.stack.contentType(contentType)
            .query()
            .locale(locale)
            .skip(skip)
            .limit(limit)
            .includeMetadata()
            .includeReference(['title', 'url']);

          const response = await query.find();
          
          if (response.items && response.items.length > 0) {
            allEntries.push(...response.items.map(entry => ({
              ...entry,
              content_type_uid: contentType
            })));
            skip += limit;
          } else {
            hasMore = false;
          }

          if (response.items.length < limit) {
            hasMore = false;
          }
        }
      }

      return allEntries;
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }

  // Process Rich Text fields
  processRichText(richTextData, findTerm, replaceTerm, options = {}) {
    if (!richTextData || typeof richTextData !== 'object') {
      return richTextData;
    }

    // Handle RTE JSON structure
    if (richTextData.children && Array.isArray(richTextData.children)) {
      return {
        ...richTextData,
        children: richTextData.children.map(child => 
          this.processRichTextNode(child, findTerm, replaceTerm, options)
        )
      };
    }

    return richTextData;
  }

  processRichTextNode(node, findTerm, replaceTerm, options) {
    if (!node || typeof node !== 'object') {
      return node;
    }

    // Process text nodes
    if (node.text && typeof node.text === 'string') {
      return {
        ...node,
        text: this.applyReplacement(node.text, findTerm, replaceTerm, options)
      };
    }

    // Process links
    if (node.type === 'a' && node.attrs) {
      const updatedNode = { ...node };
      
      // Update link text
      if (node.children) {
        updatedNode.children = node.children.map(child =>
          this.processRichTextNode(child, findTerm, replaceTerm, options)
        );
      }

      // Update URL if needed
      if (options.updateLinks && node.attrs.href) {
        updatedNode.attrs = {
          ...node.attrs,
          href: this.updateLinkURL(node.attrs.href, findTerm, replaceTerm)
        };
      }

      return updatedNode;
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map(child =>
          this.processRichTextNode(child, findTerm, replaceTerm, options)
        )
      };
    }

    return node;
  }

  // Update entry with replacements
  async updateEntry(contentTypeUid, entryUid, updatedData, locale = 'en-us') {
    try {
      const entry = this.stack.contentType(contentTypeUid).entry(entryUid);
      
      // Update entry data
      Object.assign(entry, updatedData);
      
      const response = await entry.update({ locale });
      return response;
    } catch (error) {
      console.error(`Error updating entry ${entryUid}:`, error);
      throw error;
    }
  }

  // Helper methods
  applyReplacement(text, findTerm, replaceTerm, options) {
    if (options.contextAware) {
      const nlpService = require('./nlpService');
      return nlpService.contextAwareReplace(text, findTerm, replaceTerm);
    }

    // Simple replacement
    const regex = new RegExp(`\\b${this.escapeRegex(findTerm)}\\b`, 'gi');
    return text.replace(regex, replaceTerm);
  }

  updateLinkURL(url, findTerm, replaceTerm) {
    // Simple URL replacement - you can make this more sophisticated
    if (url.includes(findTerm.toLowerCase())) {
      return url.replace(new RegExp(findTerm, 'gi'), replaceTerm);
    }
    return url;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new ContentstackService();

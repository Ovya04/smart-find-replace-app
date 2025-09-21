import stack from "../config/contentstack.js";

export const fetchContentTypes = async (req, res) => {
  try {
    const result = await stack.contentType().fetchAll();
    res.json(result.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

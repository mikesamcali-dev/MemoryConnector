Map a word to known concept domains, then emit the domains as keywords.

Step-by-step logic

Normalize the input

Lowercase the word.

Strip punctuation.

Reduce to base form if needed.

Look up the word in a concept dictionary

Maintain a curated table or JSON file.

Each entry links a term to abstract domains.

Example entry structure

term: fascist

domains: ideology, governance, state power

attributes: authoritarianism, nationalism, repression, single-party rule

Use ontology or taxonomy matching

Assign the word to a political ontology node.

Example nodes: political ideology, regime type, power structure.

In this case, fascist maps to political ideology and authoritarian regime.

Expand to related concepts

From the ontology node, pull connected concepts.

Parent nodes give broad keywords like authoritarianism.

Child nodes give specifics like paramilitary violence or censorship.

Rank and filter

Remove duplicates.

Keep only high-level political categories.

Limit output to 6 to 8 terms.

Optional enhancements

Weight keywords by frequency in academic corpora.

Use word embeddings to confirm proximity to political terms.

Cache results for common words.
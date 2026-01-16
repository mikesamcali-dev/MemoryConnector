# Logic for looking up words or phrases
- do this in the background so the UI does not slow down

## if the textarea on capture page 1 word
-  look up the one word in the word table
- if it doesn't exist, use open ai to get the definition and add it to the word table and then link it to the memory. 
-  if it does exist in the table, do not use openai to get the definition and just link the word to the memory

## if the textarea on the capture page is 2 words
-  look up the both words in the word table (multiple words together is a phrase and will still be added in the word table as if it's a word)
Example: "Red Herring"
- if the phrase doesn't exist, use open ai to get the definition of the phrase and add it to the word table and then link it to the memory. 
-  if it does exist in the table, do not use openai to get the definition and just link the word to the memory
-  DO NOT look up the each word 

## if the textarea on the capture page is 3 words
-  look up all three words in the word table (multiple words together is a phrase and will still be added in the word table as if it's a word)
Example: "on the way"
- if the phrase doesn't exist, use open ai to get the definition of the phrase and add it to the word table and then link it to the memory. 
-  if it does exist in the table, do not use openai to get the definition and just link the phrase to the memory
- DO NOT look up the each word in the phrase 

## if the textarea on the capture page is more than 3 words
- do not look up any of the words and do not link any words to the memory







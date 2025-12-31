takes the memory text

looks at any words that might be persons 
1. looks in the person table for matching - use name similarities - Mike = Michael
2. if the name doesn't exist, it creates a name in the person table

looks for any words that might be locations
1. looks in the location table for matching - use name similarities - PizzaHut = Pizza Hut 
2. if the name doesn't exist, it creates a name in the location table
3. then if the enrichment doesn't exist, it will use openai to gather more information about this location

looks for any other words that aren't as, the, I or other non descriptive words. 
1. look for matching words in the word table 
2. if the word doesn't exist, it will create a record for the word
3. then if the enrichment doesn't exist, it will use openai to gather more information about this word
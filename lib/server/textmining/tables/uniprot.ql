create table uniprot
	on select get from 'http://www.uniprot.org/uniprot/?query={query}&sort={sort}&limit={limit}&offset={offset}&format=xml'
		using defaults sort = 'score', limit = '10', offset = '0'
		resultset 'uniprot.entry';
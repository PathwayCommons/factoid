create table uniprot
	on select get from 'http://www.uniprot.org/uniprot/?query={query}&sort={sort}&limit={limit}&format=xml'
		using defaults sort = 'score', limit = '10'
		resultset 'uniprot.entry';
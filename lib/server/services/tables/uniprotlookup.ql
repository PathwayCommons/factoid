create table uniprotlookup
	on select get from 'http://www.uniprot.org/uniprot/{id}.xml'
	resultset 'uniprot.entry';
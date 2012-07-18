-- TODO revise this table when the cnio webservice is updated
create table cnio
	on select post to 'http://factoid.bioinfo.cnio.es/TextMining/gene_mention_recognition'
		using headers 'content-type' = 'application/x-www-form-urlencoded'
		using defaults normalize = 'true', method = 'method', resformat = 'json'
		using bodyTemplate 'cnio.body' type 'application/x-www-form-urlencoded';
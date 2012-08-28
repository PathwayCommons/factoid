-- TODO revise this table when the cnio webservice is updated
create table cnio.genemention
	on select get from 'http://localhost:{port}/cnio-genemention-proxy?text={text}';

create table cnio.sentences
	on select get from 'http://localhost:{port}/cnio-sentences-proxy?text={text}';
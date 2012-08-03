-- TODO revise this table when the cnio webservice is updated
create table cnio
	on select get from 'http://localhost:3000/cnioproxy?text={text}';
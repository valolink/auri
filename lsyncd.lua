settings({
	logfile = "/tmp/lsyncd.log",
	statusFile = "/tmp/lsyncd.status",
	maxDelays = 2,
})

sync({
	default.rsync,
	source = "./auriapp/",
	target = "demolink:/home/auriapp.demolink.fi/public_html/wp-content/plugins/valolink-auriapp",
	rsync = {
		compress = true,
		archive = true,
		verbose = true,
		_extra = {
			"--delete",
			"--exclude=dist/",
			"--chown=auria7201:auria7201",
		},
	},
})

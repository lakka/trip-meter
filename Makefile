start:
	@java -jar ./webdriverio-test/selenium-server-standalone-3.4.0.jar 2> ./webdriverio-test/selenium.log &
	@forever start -w -o ./server/server.log -e ./server/server.log ./server/app.js

stop:
	@forever stop ./server/app.js

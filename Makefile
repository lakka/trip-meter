reset:
	@node server/init-db.js

start:
	@java -jar -Dwebdriver.gecko.driver=./webdriverio-test/geckodriver ./webdriverio-test/selenium-server-standalone-3.4.0.jar 2> ./webdriverio-test/selenium.log &
	@forever start -w -o ./server/server.log -e ./server/server.log ./server/app.js

stop:
	@forever stop ./server/app.js

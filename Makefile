reset:
	@rm .selenium.pid
	@node server/init-db.js

start: .selenium.pid
	@cd server && forever start -w -o ./server.log -e ./server.log ./app.js

.selenium.pid:
	@cd webdriverio-test && nohup java -jar -Dwebdriver.gecko.driver=./geckodriver -Dwebdriver.chrome.driver=./chromedriver selenium-server-standalone-3.4.0.jar > selenium.log 2>&1 & echo $$! > $@

stop:
	@forever stop ./server/app.js
	@cat .selenium.pid|xargs kill 

.PHONY: reset reset-db start test stop stopnode runtests testserver server

reset: reset-db
	@rm .selenium.pid

reset-db:
	@cd server && cat init-db.sql|sqlite3 db.sqlite

start: .selenium.pid
	@cd server && forever start -w -o ./server.log -e ./server.log ./app.js

.selenium.pid:
	@cd webdriverio-test && nohup java -jar -Dwebdriver.gecko.driver=./geckodriver -Dwebdriver.chrome.driver=./chromedriver selenium-server-standalone-3.4.0.jar > selenium.log 2>&1 & echo $$! > $@

testserver:
	@cd server && NODE_ENV=test forever start -w -o ./testserver.log -e ./testserver.log ./app.js

server:
	@cd server && NODE_ENV=dev forever start -w -o ./server.log -e ./server.log ./app.js

test: stopnode testserver
	@npm test
	@${MAKE} stopnode
	@${MAKE} server

stopnode:
	@-forever stop ./server/app.js

stop: stopnode
	@cat .selenium.pid|xargs kill 

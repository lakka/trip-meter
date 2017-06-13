const assert = require('assert');

describe('Registration page', () => {
  before(() => browser.url('http://localhost:3000/register'))
  it('should have email field', () => {
    assert.equal(browser.isVisibleWithinViewport('#email'), true)
  })
  it('should have password field', () => {
    assert.equal(browser.isVisibleWithinViewport('#password'), true)
  })
  it('should have password again field', () => {
    assert.equal(browser.isVisibleWithinViewport('#password-again'), true)
  })
  it('should have disabled submit button', () => {
    assert.equal(browser.isVisibleWithinViewport('#submit'), true)
    assert.equal(browser.isEnabled('#submit'), false)
  })
  it('should show error on invalid email', () => {
    const email = $('#email')
    const error = $('#email-syntax-error')
    email.setValue('jeesus')
    error.waitForExist(2000)
    assert.equal(error.isVisibleWithinViewport(), true)
    email.clearElement()
  })
  it('should show error on existing email', () => {
    const email = $('#email')
    const error = $('#email-exists-error')
    email.setValue('admin@example.com')
    error.waitForExist(2000)
    assert.equal(error.isVisibleWithinViewport(), true)
    email.clearElement()
  })
  it('should show error on invalid password', () => {
    const pass = $('#password')
    const error = $('#pass-syntax-error')
    pass.setValue('jeesus')
    error.waitForExist(2000)
    assert.equal(error.isVisibleWithinViewport(), true)
    pass.clearElement()
  })
  it('should show error when passwords don\'t match', () => {
    const pass = $('#password')
    const passAgain = $('#password-again')
    const error = $('#pass-no-match-error')
    pass.setValue('jeesussimasuu')
    passAgain.setValue('jeesusski')
    error.waitForExist(2000)
    assert.equal(error.isVisibleWithinViewport(), true)
    pass.clearElement()
  })
});

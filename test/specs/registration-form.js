const assert = require('assert');

describe('Registration page', function() {
  before(() => browser.url('http://localhost:3000/register'))
  it('should have email field', function () {
    assert.equal(browser.isVisibleWithinViewport('#email'), true)
  })
  it('should have password field', function () {
    assert.equal(browser.isVisibleWithinViewport('#password'), true)
  })
  it('should have password again field', function () {
    assert.equal(browser.isVisibleWithinViewport('#password-again'), true)
  })
  it('should have disabled submit button', function () {
    assert.equal(browser.isVisibleWithinViewport('#submit'), true)
    assert.equal(browser.isEnabled('#submit'), false)
  })
  it.only('should show error on invalid email', function () {
    browser.setValue('#email', 'jeesus')
    const error = $('.error')
    error.waitForExist(1000)
    assert.equal(error.isVisibleWithinViewport(), true)
  })
});

import 'mocha';
import { expect, assert } from 'chai';
import { driver, Key } from 'mocha-webdriver';
import { app } from './../dist/server/app';

// tslint:disable-next-line: no-var-requires
const shell = require('shelljs');

async function waitSeconds(s: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, s * 1000);
    });
}


const TIMEOUT = 60000;
const PORT = 20000;
const PATH = `http://localhost:${PORT}`;

shell.exec('npm run createdb');
const server = app.listen(PORT);

describe('test server for logging', () => {
    it('should redirect to home page after logged in', async () => {
        await removeSession();
        await driver.get(PATH);
        await doLogin();
        const buttonClasses = await driver.find('#loginButton').getAttribute('class');
        expect(buttonClasses).to.include('is-hidden');
    });

    it('should show error after invalid passord inputed', async () => {
        await removeSession();
        await driver.get(PATH);
        await doInvalidLogin();
        const error = await driver.find('#loginPanel > div.modal-content > div > div > form > div:nth-child(3) > p').getText();
        expect(error).to.include('Invalid password.');
    });

    it('should log out all sessions when password has changed', async () => {
        await removeSession();
        await driver.get(PATH);
        await doLogin();

        const session = await driver.manage().getCookie('connect.sid');

        await removeSession();
        await driver.get(PATH);
        await doLogin();
        await doChangePassword();

        await removeSession();
        await driver.manage().addCookie({ name: 'connect.sid', value: session.value });
        await driver.get(PATH);
        const buttonClasses = await driver.find('#loginButton').getAttribute('class');
        expect(buttonClasses).to.not.include('is-hidden');
    });
});

describe('test server for correct quiz managemant', () => {
    it('should not open if user is not logged in', async () => {
        await removeSession();
        await openQuiz();

        const err = await driver.getPageSource();
        expect(err).to.include('User not logged in.');
    });

    it('should start button be disabled in user is not logged in', async () => {
        await removeSession();
        await driver.get(PATH);

        const button = await driver.find('#startButton');
        const disabled = await button.getAttribute('disabled');
        expect(disabled).to.be.equal('true');
    });

    it('should display overlay after completed quiz', async () => {
        await removeSession();
        await driver.get(PATH);
        await doLogin();
        await doQuiz();

        await waitSeconds(5);

        const overlay = await driver.find('#overlay');
        const overlayDisplay = await overlay.getCssValue('display');
        expect(overlayDisplay).to.include('block');


        const correct = await driver.findAll('.correct');
        expect(correct.length).to.be.equal(2);
        for(const ans of correct) {
            const text = await ans.getText();
            expect(text).to.be.equal('4');
        }

        const wrong = await driver.findAll('.wrong');
        expect(wrong.length).to.be.equal(4);
        for(const ans of wrong) {
            const text = await ans.getText();
            expect(text).to.be.equal('4');
        }


        const returnButton = await driver.find('#results > a');
        await returnButton.doClick();

        const url = await driver.getCurrentUrl();
        expect(url).to.not.include('play');
    });

    it('should not open the same quiz second time', async () => {
        await removeSession();
        await driver.get(PATH);
        await doLogin();
        await openQuiz();

        await waitSeconds(5);

        const error = await driver.find('#errorPanel');
        const errorClasses = await error.getAttribute('class');
        expect(errorClasses).to.include('is-active');

        const errorBody = await driver.find('#error-body');
        const errorMsg = await errorBody.getText();
        expect(errorMsg).to.include('Quiz already solved.');
    });
});


async function removeSession(): Promise<void> {
    return driver.manage().deleteCookie('connect.sid');
}

async function doLogin(): Promise<void> {
    await driver.find('#loginButton').doClick();
    await driver.find('#username').sendKeys('user1');
    await driver.find('#password').sendKeys('user1');
    await driver.find('#loginPanel > div.modal-content > div > div > form > div:nth-child(4) > p > input').doClick();
}

async function doInvalidLogin(): Promise<void> {
    await driver.find('#loginButton').doClick();
    await driver.find('#username').sendKeys('user1');
    await driver.find('#password').sendKeys('lol');
    await driver.find('#loginPanel > div.modal-content > div > div > form > div:nth-child(4) > p > input').doClick();
}

async function doChangePassword(): Promise<void> {
    await driver.find('#changePassButton').doClick();
    await driver.find('#pass1').sendKeys('user1');
    await driver.find('#pass2').sendKeys('user1');
    await driver.find('#changePanel > div.modal-content > div > div > form > div:nth-child(4) > p > input').doClick();
}

async function openQuiz(): Promise<void> {
    await driver.get(PATH + '/play/1');
}

async function doQuiz(): Promise<void> {
    await openQuiz();
    await waitSeconds(5);

    const answer = driver.find('#answer');
    const button = driver.find('#submitButton');

    let buttonClass = await button.getAttribute('class');
    while(buttonClass.includes('is-success')) {
        buttonClass = await button.getAttribute('class');

        await answer.sendKeys('4');
        await button.doClick();
    }
}
'use strict';

String.prototype.repeat = function (num) {
    return new Array(isNaN(num) ? 1 : ++num).join(this);
};

var phoneBook = {};

/**
 * Очистка от пробелов и приведение в нижний регистр
 * поля email
 * @param email
 * @returns {string}
 */
function cleanName(email) {
    if (typeof (String.prototype.trim) === undefined) {
        String.prototype.trim = function () {
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }
    return email.toLowerCase().trim();
}

/**
 * Очистка поля телефон от скобок, + и пробелов
 * @param phone
 * @returns {string|XML}
 */
function cleanPhone(phone) {
    phone = phone.replace(/\s+/g, '').replace(/\-+/g, '');
    return phone.replace(/\++/g, '').replace(/\(+/g, '').replace(/\)+/g, '');
}

/**
 * Добавление новой записи в книгу
 * @param name Имя
 * @param phone Телефон
 * @param email Email
 * @returns {*} Результат операции
 */
module.exports.add = function add(name, phone, email) {
    var emailRe = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    var phoneRe = /^\+?\d*?[- ]?(\({1}\d{3}\){1}|\d{3})[- ]?\d{3}[- ]?\d?[- ]?\d{3}$/;
    var cleanedEamil = cleanName(email);
    var toAdd = {name: name, phone: phone, clean_phone: cleanPhone(phone), email: cleanedEamil};
    if (emailRe.test(email) && phoneRe.test(phone)) {
        /* Раз в примере у людей повторяются email (что старнно),
         то за ключ в словаре берем и email и имя
         */
        phoneBook[[cleanedEamil, name].join('_')] = toAdd;
        return {status: 200, descr: 'added', data: toAdd};
    } else {
        return {status: 500, descr: 'error with data validation', data: toAdd};
    }
};

/**
 * Поиск по телефонной книге
 * @param query
 * @returns {{}} часть объекта phoneBook
 */
var search = function (query) {
    var pbKeys = Object.keys(phoneBook);
    var searchResult = {};
    for (var pbKey in phoneBook) {
        if (phoneBook.hasOwnProperty(pbKey)) {
            var toSearchIn = '';
            var toSearchInDict = phoneBook[pbKey];
            var toSearchInKeys = Object.keys(toSearchInDict);
            for (var field in toSearchInDict) {
                toSearchIn = toSearchIn.concat(toSearchInDict[field]);
            }
            if (toSearchIn.indexOf(query) != -1) {
                searchResult[pbKey] = phoneBook[pbKey];
            }
        }
    }
    return searchResult;
};

/**
 * Функция поиска записи в телефонной книге.
 * Поиск ведется по всем полям.
 * @param query
 * @returns {{}} словарь с результатами
 */
module.exports.find = function find(query) {
    if (query == '') {
        return phoneBook;
    }
    var searchResult = search(query);
    /* Странно, конечно, в этой функции что-то выводить в консоль,
     но в задании описанно именно так
     */
    for (var key in searchResult) {
        console.log([searchResult[key]['name'],
                     searchResult[key]['phone'],
                     searchResult[key]['email']].join(', '));
    }
    return searchResult;
};

/**
 * Функция удаления записи в телефонной книге.
 * @param query
 * @returns {{deleted: Number, deleted_data}}
 */
module.exports.remove = function remove(query) {
    var searchResult = search(query);
    for (var key in searchResult) {
        delete phoneBook[key];
    }
    // И опять выводим в консоль
    console.log(['Deleted', Object.keys(searchResult).length, 'contacts'].join(' '));
    return {deleted: Object.keys(searchResult).length, deleted_data: searchResult};
};

/**
 * Функция импорта записей из файла (задача со звёздочкой!).
 * @param filename
 * @returns {Array} Все добавленные записи
 */
module.exports.importFromCsv = function importFromCsv(filename) {
    var data = require('fs').readFileSync(filename, 'utf-8');
    data = data.replace(/\n+$/g, '').split('\n');
    var addedData = [];
    data.forEach(function (record, i, data) {
        record = record.split(';');
        var resData = module.exports.add(record[0], record[1], record[2]);
        if (resData['status'] == 200) {
            addedData.push(resData);
        }
    });
    console.log(['Added', addedData.length, 'records'].join(' '));
    return addedData;
};

/**
 * Вспомогательная функция находит длинну самого длинного значения
 * по заданому ключу
 * @param key
 * @returns {number}
 */
var longestValByKey = function (key) {
    var mLen = 0;
    for (var k in phoneBook) {
        for (var ik in phoneBook[k]) {
            if (ik == key) {
                if (phoneBook[k][key].length > mLen) {
                    mLen = phoneBook[k][key].length;
                }
            }
        }
    }
    return mLen;
};

/**
 * Функция вывода всех телефонов в виде ASCII (задача со звёздочкой!).
 */
module.exports.showTable = function showTable() {
    var nameLen = longestValByKey('name');
    var phoneLen = longestValByKey('phone');
    var emailLen = longestValByKey('email');
    console.log(['┌',
        '─'.repeat(nameLen),
        '┬', '─'.repeat(phoneLen),
        '╥', '─'.repeat(emailLen), '┐'].join(''));
    console.log(['|',
        'Имя', ' '.repeat(nameLen - 3), '│',
        'Телефон', ' '.repeat(phoneLen - 7), '║',
        'email', ' '.repeat(emailLen - 5), '│'].join(''));
    console.log(['├', '─'.repeat(nameLen),
                 '┼', '─'.repeat(phoneLen),
                 '╫', '─'.repeat(emailLen), '┤'].join(''));
    for (var key in phoneBook) {
        var record = phoneBook[key];
        console.log([
            '│', record['name'], ' '.repeat(nameLen - record['name'].length),
            '│', record['phone'], ' '.repeat(phoneLen - record['phone'].length),
            '║', record['email'], ' '.repeat(emailLen - record['email'].length), '│'].join(''));
    }
    console.log(['└', '─'.repeat(nameLen),
                 '┴', '─'.repeat(phoneLen),
                 '╨', '─'.repeat(emailLen), '┘'].join(''));
};

/**
 * Показать всю книгу
 * @returns {{}} phoneBook
 */
module.exports.showBook = function showBook() {
    return phoneBook;
};

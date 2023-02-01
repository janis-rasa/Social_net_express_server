module.exports = function () {
	const faker = require('faker')
	const _ = require('lodash')

	const maxUsers = 10

	function generateUniqueNumbersArray(arrayLength, maxNumber) {
		let uniqueArray = []
		if (arrayLength < maxNumber) {
			let arrayNumber
			_.times(faker.random.number(arrayLength), function () {
				while (!uniqueArray.includes(arrayNumber = faker.random.number({min: 1, max: maxNumber}))) {
					uniqueArray = [...uniqueArray, arrayNumber]
				}
			})
		}
		uniqueArray.sort((a, b) => a - b);
		return uniqueArray
	}

	return {
		profiles: _.times(maxUsers, function (n) {
			let gender = (faker.random.boolean ? 'male' : 'female')
			let firstName = faker.name.firstName(gender)
			let lastName = faker.name.lastName(gender)
			let id = n + 1
			return {
				id: id,
				email: faker.internet.email(firstName, lastName),
				name: firstName + ' ' + lastName,
				status: {status: faker.lorem.sentences()},
				location: {
					city: faker.address.city(),
					country: faker.address.country()
				},
				avatarUrl: faker.internet.avatar(),
				profile: {
					contacts: {
						website: (faker.random.boolean ? firstName + '.' +  faker.internet.domainName() : null)
					},
					jobTitle: (faker.random.boolean ? faker.name.jobTitle : null),
					gender: gender,
					background: 'https://picsum.photos/id/'+ id +'/1280/260.jpg',
				}
			}
		})
	}
}


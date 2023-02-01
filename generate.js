module.exports = function () {
	const faker = require("faker")
	const _ = require("lodash")

	const maxUsers = 10
	const maxPosts = 10

	function generateUniqueNumbersArray(arrayLength, maxNumber) {
		let uniqueArray = []
		if (arrayLength < maxNumber) {
			let arrayNumber = 0
			_.times(faker.random.number(arrayLength), function () {
				arrayNumber = faker.random.number({ min: 1, max: maxNumber })
				while (
					!uniqueArray.includes((arrayNumber))
				) {
					uniqueArray = [...uniqueArray, arrayNumber]
				}
			})
		}
		uniqueArray.sort((a, b) => a - b)
		return uniqueArray
	}

	return {
		users: _.times(maxUsers, function (n) {
			let gender = faker.random.boolean ? "male" : "female"
			let firstName = faker.name.firstName(gender)
			let lastName = faker.name.lastName(gender)
			let id = n + 1
			return {
				id: id,
				email: faker.internet.email(firstName, lastName),
				credentials: {
					name: firstName,
					surname: lastName,
				},
				status: { status: faker.lorem.sentences() },
				location: {
					city: faker.address.city(),
					country: faker.address.country(),
				},
				followed: generateUniqueNumbersArray(maxUsers - 2, maxUsers),
				avatarUrl: faker.internet.avatar(),
				profile: {
					contacts: {
						website: faker.random.boolean ? firstName + "." + faker.internet.domainName() : null,
					},
					jobTitle: faker.random.boolean ? faker.name.jobTitle : null,
					gender: gender,
					background: "https://picsum.photos/id/" + id + "/1280/260.jpg",
				},
			}
		}),
		posts: _.times(maxPosts, function (n) {
			return {
				id: n + 1,
				userId: faker.random.number(maxUsers),
				title: faker.lorem.sentence(faker.random.number({ min: 3, max: 6 })),
				message: faker.lorem.paragraph(),
				likesCount: faker.random.number(maxUsers - 1),
			}
		}),
		dialogs: _.times(maxPosts, function (n) {
			return {
				id: n + 1,
				author: faker.random.number(maxUsers),
				userId: faker.random.number(maxUsers),
				message: faker.lorem.paragraph(),
			}
		}),
	}
}

/* Passwords for testing
 *
 * "password": "bestPassw0rd"
 * "password": "$2a$10$wPxKfe.Cq8J3E7/O29vFRum7XYhU.LTGOcGYjaw6a3aJRpH.TBEza",
 *
 * "password": "password"
 * "password": "$2a$12$nv9iV5/UNuV4Mdj1Jf8zfuUraqboSRtSQqCmtOc4F7rdwmOb9IzNu",
 *
 * "password": "password1",
 * "password": "$2y$10$0fJilNfJUkzVfeU5lkrUH..3wf6WOXkrsLeQttbM5Drj2RXi6PFKK",
 *
 * */

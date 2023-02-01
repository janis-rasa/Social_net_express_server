//npm modules
const express = require('express')
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const axios = require('axios')
const bcrypt = require('bcrypt')
const cors = require('cors')
const formidable = require('formidable');
const fs = require('fs')
const sharp = require('sharp')

const corsOptions = {
	origin: 'http://localhost:3000',
	credentials: true
}

// Send error function

const sendError = (res, error) => {
	res.send({
		message: "Error: " + error,
		resultCode: 1
	})
}

// All OK response

const allOk = {resultCode: 0, message: 'OK'}

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
	{usernameField: 'email'},
	(email, password, done) => {
		axios.get(`http://localhost:5000/users_auth_data?email=${email}`)
			.then(res => {
				const user = res.data[0]
				if (!user) {
					return done(null, false, {message: 'Sorry, invalid credentials', resultCode: 1, error: 'error'})
				}
				if (!bcrypt.compareSync(password, user.password)) {
					return done(null, false, {message: 'Sorry, invalid credentials', resultCode: 1, error: 'error'})
				}
				delete user.password
				return done(null, {data: {...user}, ...allOk})
			})
			.catch(error => done(error))
	}
))

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
	done(null, user.data.id)
})

passport.deserializeUser((id, done) => {
	axios.get(`http://localhost:5000/users/${id}`)
		.then(res => done(null, res.data))
		.catch(error => done(error, false))
})

// create the server
const app = express();

// add & configure middleware
app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(session({
	genid: (req) => {
		return uuid() // use UUIDs for session IDs
	},
	store: new FileStore(),
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/assets', express.static('uploads'));

const getData = (req, res) => {
	axios.get(`http://localhost:5000${req.url}`)
		.then(response => {
			let total = response.headers["x-total-count"] ? response.headers["x-total-count"] : 0
			res.send({data: response.data, xTotal: total, ...allOk})
		})
		.catch(error => sendError(res, error))
}

// create the homepage route at '/'
app.get('/', (req, res) => {
	res.send(`You got home page!\n`)
})

// create the login get and post routes
app.get('/api/login', (req, res) => {
	res.send(`You got the login page!\n`)
})

app.post('/api/login', (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (info) {
			return res.send(info)
		}
		if (err) {
			return next(err)
		}
		if (!user) {
			return res.redirect('/login')
		}
		req.login(user, (err) => {
			if (err) {
				return next(err)
			}
			return res.send(user) // res.redirect('/authenticated')
		})
	})(req, res, next)
})

app.get('/api/authenticated', (req, res, next) => {
	if (req.isAuthenticated()) {
		res.send({
			data: {
				userId: req.user.id,
				url: req.url
			},
			message: "You are authorized!",
			resultCode: 0
		})
	} else {
		res.send({message: "You are not authorized", resultCode: 1})
	}
})

app.get('/api/logout', (req, res) => {
	if (req.isAuthenticated()) {
		req.logOut()
		res.send({message: "You are logged out", resultCode: 0})
	} else {
		res.send({message: "You are not logged in, for logout", resultCode: 1})
	}
})

/** UPLOAD a file **/
app.post('/api/upload', (req, res) => {

	if (req.isAuthenticated()) {
		// create an incoming form object
		const form = formidable({
			multiples: false,
			uploadDir: __dirname + '/uploads',
			maxFileSize: 3145728
		});

		form.parse(req, (err, fields, files) => {
			if (err) {
				sendError(res, err)
			}

			if (files.file.type === 'image/jpeg') {

				const width = 128
				const height = 128

				sharp(files.file.path)
					.resize(width, height)
					.jpeg({ quality: 90 })
					.toFile(form.uploadDir + '/' + files.file.name, (err) => {
						if (err) {
							sendError(res, err)
						} else {
							fs.unlinkSync(files.file.path)
							let oldFile = fields['oldFile'].replace("http://localhost:3004/assets/", "");
							oldFile = form.uploadDir + '/' + oldFile
							if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
							res.send({
								message: "Get file " + files.file.name,
								resultCode: 0
							})
						}
					});

			} else {
				fs.unlinkSync(files.file.path)
				res.send({
					message: "Sorry, only image/jpeg allowed",
					resultCode: 1
				})
			}

		});

	} else {
		res.send({message: "You are not authorized", resultCode: 1})
	}
	// parse the incoming request containing the form data
});

app.get('/api/*', (req, res) => {
	getData(req, res)
})

app.get('/api/users_auth_data', (req, res) => {
	if (req.isAuthenticated()) {
		getData(req, res)
	} else {
		res.send({message: "You are not logged in", resultCode: 1})
	}
})

app.post('/api/*', (req, res) => {
	if (req.isAuthenticated()) {
		axios.post(`http://localhost:5000${req.url}`, req.body)
			.then(response => {
				res.send({data: response.data, ...allOk})
			})
			.catch(error => sendError(res, error))
	} else {
		res.send({message: "You are not logged in", resultCode: 1})
	}
})

app.put('/api/*', (req, res) => {
	if (req.isAuthenticated()) {
		axios.put(`http://localhost:5000${req.url}`, req.body)
			.then(response => {
				res.send({data: response.data, ...allOk})
			})
			.catch(error => res.send({message: error.message, resultCode: 1, url: req.url}))
	} else {
		res.send({message: "You are not logged in", resultCode: 1})
	}
})

// tell the server what port to listen on
app.listen(3004, () => {
	console.log('Listening on localhost:3004')
})
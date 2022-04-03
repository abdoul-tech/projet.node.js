require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const MongoClass = require('./services/mongo.class')
const PostModel = require('./models/post.model');



class ServerClass {
    constructor() {
        this.server = express();
        this.port = process.env.PORT;
        this.mongDb = new MongoClass();
    }

    init() {
        this.server.use((req, res, next) => {
            const allowedOrigins = ['http://localhost:8080', 'http://localhost:8080'];
            const origin = req.headers.origin;

            if(allowedOrigins.indexOf(origin) > -1){ res.setHeader('Access-Control-Allow-Origin', origin)}
            // res.setHeader('Access-Control-Allow-Origin', origin)
            // res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Methods', ['GET', 'PUT', 'POST', 'DELETE']);
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        //=> Set body request with ExpressJS (http://expressjs.com/fr/api.html#express.json)
        this.server.use(express.json({ limit: '20mb' }));
        this.server.use(express.urlencoded({ extended: true }))

        // this.server.use(cookieParser(process.env.COOKIE_SECRET));

        //=> Start server setup
        this.config();
    }

    config() {
        const { setAuthentication } = require('./services/passport.service');
        setAuthentication(passport);

        const AuthRouterClass = require('./router/auth.router');
        const authRouter = new AuthRouterClass({ passport });
        this.server.use('/v1/auth', authRouter.init());
        
        const ApiRouterClass = require('./router/api.router');
        const apiRouter = new ApiRouterClass({ passport });
        this.server.use('/v1', apiRouter.init());

        this.launch();
    }

    launch() {
        this.mongDb.connectDb()
            .then(db => {
                this.server.listen(this.port, () => {
                    console.log({
                        node: `http://localhost:${this.port}`,
                        db: db.url,
                    })
                })
            })
            .catch(dbError => {
                console.log(dbError)
            })
    }
}



const MyServer = new ServerClass();
MyServer.init();
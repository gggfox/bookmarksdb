const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const morgan = require( 'morgan' );
const uuid = require( 'uuid' );
const validateApiKey = require( './middleware/validateToken');
const mongoose = require( 'mongoose' );
const { Bookmarks } = require( './bookmarkModel' );

const jsonParser = bodyParser.json();
const app = express();
app.use( morgan('dev') );
app.use( validateApiKey );

/*
const post = {
    id: uuid.v4(),
    title: String,
    description: String,
    url: String,
    rating: Number
}
*/


//get all bookmarks
app.get('/bookmarks', ( req, res ) => {
    console.log( "Getting all bookmarks.");
    console.log( req.test );

    console.log( "Headers", req.headers );
    
    Bookmarks
    .getAllBookmarks()
    .then( results => {
        return res.status( 200 ).json( results );
    })
});

//get by title 1:N
app.get('/bookmark', (req, res ) => {
    console.log( "getting bookmark by title." );
    console.log( req.query.value );

    let title = req.query.value;

    if( title === undefined){
        res.statusMessage = "Please send the 'title' as parameter.";
        return res.status( 406 ).end();
    }
    
    Bookmarks
    .getBookmarksByTitle( title )
    .then( results => {
        if( results.length > 0 ){
            return res.status( 200 ).json( results );
        }else{
            res.statusMessage = `There where no bookmarks with the provided 'title=${title}'`;
            return res.status( 404 ).end();
        }
    })

});

//create bookmark
app.post( '/bookmarks', jsonParser, ( req, res) => {
    let id = uuid.v4();
    let title = req.body.title;
    let description = req.body.description;
    let url = req.body.url;
    let rating = req.body.rating;
    
    console.log(description);
    if( !title || !description || !url || !rating){
        res.statusMessage = "Some parameter is missing";
        return res.status( 406 ).end();
    }

    console.log(" all parameters exist ");
    let newBookmark = { id, title, description, url, rating };

    Bookmarks
    .createBookmark( newBookmark )
    .then( result => {
        return res.status( 201 ).json( result );
    })
    .catch( err => {
        res.statusMessage = "Something went wrong with the database";
        return res.status( 500 ).end()
    })

});

//delete bookmark
app.delete( '/bookmark/:id', ( req, res) => {
    let id = req.params.id;
    console.log( id );
    if( !id ){
        res.statusMessage = "id wasn't sent";
        return res.status( 404 ).end();
    }

    Bookmarks
    .deleteBookmarkById( id )
    .then( result => {
        console.log( "item has been removed" );
        res.statusMessage = "item has been removed";
        return res.status( 201 ).end();
    })
    .catch( err => {
        console.log( "there has been an error" );
        res.statusMessage =   "error in database";
        return res.status( 404 ).end()
    })

});

//update bookmark, bookmarks update each time you run the server
app.patch( '/bookmark/:id', jsonParser, ( req, res ) => { 
    let id = req.params.id;

    if( !id ){
        res.statusMessage = "The id of the bookmark is missing";
        res.status( 406 ).end();
    }

    if ( id != req.body.id ){
        res.statusMessage = "the id's dont match";
        res.status( 409 ).end();
    }

    console.log(' the id is correct');
    console.log(req.body);
    console.log( typeof(id));
    Bookmarks
    .updateBookmark( id, req.body )
    .then( result => {
        if(result.nModified == 0){
            console.log("nothing was updated");
        }else{
            console.log( "bookmark has been updated" );
        }

        console.log(result);
        return res.status( 201 ).end();
    })
    .catch( err => {
        console.log( `there has been an error in the db ${err}` );
        res.statusMessage =   "error in database";
        return res.status( 500 ).end()
    })

});

//primary access point
app.listen( 8088, () => {
    console.log("Thise server is running on por 8088");

    new Promise( (resolve, reject) => {
        mongoose.connect( 'mongodb://localhost/bookmarksdb', { useNewUrlParser:true, useUnifiedTopology:true}, ( err ) => {
            if ( err ){
                rejected( err );
            }else{
                return resolve();
            }
        })
    })
    .catch( err => {
        mongoose.disconnect();
        console.log( err );
    })
});
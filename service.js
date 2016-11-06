// Copyright 2014-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var google = require('googleapis');
var drive = google.drive('v3');
var fs = require('fs');
/**
 * The JWT authorization is ideal for performing server-to-server
 * communication without asking for user consent.
 *
 * Suggested reading for Admin SDK users using service accounts:
 * https://developers.google.com/admin-sdk/directory/v1/guides/delegation
 *
 * Note on the private_key.pem:
 * Node.js currently does not support direct access to the keys stored within
 * PKCS12 file (see issue comment
 * https://github.com/joyent/node/issues/4050#issuecomment-8816304)
 * so the private key must be extracted and converted to a passphrase-less
 * RSA key: openssl pkcs12 -in key.p12 -nodes -nocerts > key.pem
 *
 * See the defaultauth.js sample for an alternate way of fetching compute credentials.
 */
 
 
/*
	Todo : Faire le test avec un stockage du pem en base
*/ 
var authClient = new google.auth.JWT(
    'redway-esb@appspot.gserviceaccount.com',
    'redway2.pem',
    '',
    ['https://www.googleapis.com/auth/drive'],    
    '');

authClient.authorize(function (err, tokens) {
  if (err) {
	console.log('Erreur avec le token');
    return console.log(err);
  }
  
// Type de fichier ainsi que le contenu
/*var media = {
	mimeType: 'text/plain',
	body: "hello world"
};*/


var media  = {
	mimeType: 'application/pdf',
	body: null
};
  
// Propriété du fichier
var fileProperties = {
	  name : 'test.pdf',
	  parents : [ {} ],
	  permission : {
			role : 'reader',
			type : 'anyone'		
	  }
};
  
  
var dirMetadata = {
		'name' : 'SAP/Invoices',
		'mimeType' : 'application/vnd.google-apps.folder',
		'permission' : {
			'role' : 'writer',
			'type' : 'user',
			'emailAddress' : ['sylvain.ragneau@gmail.com','sylvain.ragneau@nrco.com']
	  },
};
	
	
  
  /*
	Création du dossier si nécesaire 
  */   
   var dirId = null;
	drive.files.list({ 
		auth: authClient, 
		q: "name='"+dirMetadata.name+"'" },
		function (err, resp) {
			if (err) {
			  return console.log(err);
			}
			var files = resp.files;
			if (files.length == 0) {
			  console.log('Dossier pas encore créé.');
			   
			   drive.files.create({
				   auth: authClient,
				   resource: dirMetadata,
				   fields: 'id'
				}, function(err, dir) {
				  if(err) {
					// Handle error
					console.log(err);
				  } else {
					console.log('Folder Id: ', dir.id);
					dirId = dir.id;
					drive.permissions.create({ 
								   auth: authClient,
								   fileId: dir.id,
								   resource: dirMetadata.permission
								  
								}, function(err, permission) {
								  if(err) {
									console.log("Erreur modification permission Dossier");
									console.log(err);
								  } else {
									
									console.log("Nouveau Dossier: ", dir.id);
									// Vérifier que le fichier n'existe pas déjà si c'est le cas, on retourne l'id existant.
								   // Penser à mettre un pamamètre boolean pour détruire le fichier si demandé
									drive.files.list({ 
										auth: authClient, 
										q: "name='"+fileProperties.name+"'" },
										function (err, resp) {
											if (err) {
											  return console.log(err);
											}
											var files = resp.files;
											if (files.length == 0) {
											  console.log('Fichier pas encore créé.');
											  // Si le fichier n'existe pas encore, on le créé avec les paramètres
											  fileProperties.parents[0] = dirId;
											  var req = drive.files.create({ 
												   auth: authClient,												   
												   media: media,	  
												   fields: 'id',
												   resource: fileProperties	   
												}, function(err, file) {
												  if(err) {
													console.log("Erreur Création Fichier");
													console.log(err);
												  } else {
													
													drive.permissions.create({ 
													   auth: authClient,
													   fileId: file.id,
													   resource: fileProperties.permission
													  
													}, function(err, permission) {
													  if(err) {
														// Handle error
														console.log("Erreur modification permission Fichier");
														console.log(err);
													  } else {
														console.log("Nouveau Fichier: ", file.id);
													  } 
												  });
													//console.log("file uri ",  req.uri.href);
												  } 
											  });
											  
											} else {
											  console.log('Fichier trouvé:');
											  for (var i = 0; i < files.length; i++) {
												var file = files[i];
												console.log('%s | Id : (%s)', file.name, file.id);
												return file.id; // On retourne l'id du fichier existant
											  }
											}
									});	// Fin du traitement  
									
					     		  } 
					 });
				  }
				});
						  
			} else //Dossier trouvé on lui ajoute le fichier
			
			{
			 
			  for (var i = 0; i < files.length; i++) {
				var file = files[i];
				console.log('Dossier trouvé:');
				console.log('%s Dossier | id : %s', file.name, file.id);				
				dirId = file.id;
			  }
				// On retourne l'id du dossier existant
				// Vérifier que le fichier n'existe pas déjà si c'est le cas, on retourne l'id existant.
			    // Todo : Penser à mettre un pamamètre boolean pour détruire le fichier si demandé
				/*drive.files.list({ 
					auth: authClient, 
					q: "name='"+fileProperties.name+"'" },
					function (err, resp) {
						if (err) {
						  return console.log(err);
						}
						var files = resp.files;
						if (files.length == 0) {
						  console.log('Fichier pas encore créé.');
						  
						   // Si le fichier n'existe pas encore, on le créé avec les paramètres
						  fileProperties.parents[0] = dirId;
						  var req = drive.files.create({ 
							   auth: authClient,
							   media: media,	 
							   fields: 'id',							   
							   resource: fileProperties	   
							}, function(err, file) {
							  if(err) {
								// Handle error
								console.log(err);
							  } else {
								
								drive.permissions.create({ 
								   auth: authClient,
								   fileId: file.id,
								   resource: fileProperties.permission
								  
								}, function(err, permission) {
								  if(err) {
									// Handle error
									console.log(err);
								  } else {
									console.log("Nouveau Fichier: ", file.id);
								  } 
							  });
								//console.log("file uri ",  req.uri.href);
							  } 
						  });
						  
						} else {
						  console.log('Fichier trouvé:');
						  for (var i = 0; i < files.length; i++) {
							var file = files[i];
							console.log('%s | Id : (%s)', file.name, file.id);
							return file.id; // On retourne l'id du fichier existant
						  }
						}
				});	// Fin du traitement  */
				//fs.createWriteStream('/tmp/resume.pdf');

				fs.readFile('test.pdf', '', function (err,data) {
				  if (err) {
					return console.log(err);
				  }
				  //console.log(data);
				  						   // Si le fichier n'existe pas encore, on le créé avec les paramètres
						  fileProperties.parents[0] = dirId;
						  
  						  media.body = data; // On remplit le fichier pdf
						  //console.log(media.body);
						  var req = drive.files.create({ 
							   auth: authClient,
							   media: media,	 
							   fields: 'id',							   
							   resource: fileProperties	   
							}, function(err, file) {
							  if(err) {
								// Handle error
								console.log(err);
							  } else {
								console.log("Fin crétion Fichier : " + file.id);
								//console.log("file uri ",  req.uri.href);
							  } 
						  });
				  
						
				});
				
			}
		});	// Fin Création dossier  
});
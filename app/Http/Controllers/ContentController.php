<?php namespace App\Http\Controllers;
    use Input, Session, Response;
class ContentController extends Controller {

	public function anyDownload(){


		return Response::download($file['full_path'],$file['name']);
	}

	public function anyUpload(){
		if (Input::hasFile('upload')){
			$file = Input::file('upload');
			return Content::indexFile($file);
		}
		else{
			throw new Exception('nofile');
		}
	}
}
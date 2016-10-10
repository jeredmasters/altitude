<?php namespace App\Http\Controllers;
      use Input, Session, Response;
class AuthController extends Controller {
    public function anyUser(){
        return Response::Json(\Session::get('currentUser'));
    }

	public function anyGoogle() {

		// get data from input
		$code = \Input::get( 'code' );

		// get google service
		$googleService = OAuth::consumer( 'Google' );

		// check if code is valid

		// if code is provided get user data and sign in
		if ( !empty( $code ) ) {

			// This was a callback request from google, get the token
			$token = $googleService->requestAccessToken( $code );

			// Send a request with it
			$result = json_decode( $googleService->request( 'https://www.googleapis.com/oauth2/v1/userinfo' ), true );

			$message = 'Your unique Google user id is: ' . $result['id'] . ' and your name is ' . $result['name'];
			//echo $message. "<br/><br/><br/>";
			


			//Var_dump
			//display whole array().
			//dd($result);

			$user = User::CreateFromProvider('google',$result);

			if ($user !== false){
				Session::put('currentUser',$user);
			}
			//return Response::Json($user);

			return Angular::Redirect('/home');
		}
		// if not ask for permission first
		else {
			// get googleService authorization
			$url = $googleService->getAuthorizationUri();

			// return to google login url
			return Redirect::to( (string)$url );
		}

		
	}


	public function anyFacebook() {

		// get data from input
		$code = Input::get( 'code' );

		// get fb service
		$fb = OAuth::consumer( 'Facebook' );

		// check if code is valid

		// if code is provided get user data and sign in
		if ( !empty( $code ) ) {

			// This was a callback request from facebook, get the token
			$token = $fb->requestAccessToken( $code );

			// Send a request with it
			$result = json_decode( $fb->request( '/me' ), true );

			$message = 'Your unique facebook user id is: ' . $result['id'] . ' and your name is ' . $result['name'];
			echo $message. "<br/>";

			//Var_dump
			//display whole array().
			//dd($result);

			$user = User::CreateFromProvider('facebook',$result);

			if ($user !== false){
				Session::put('currentUser',$user);
			}
			//return Response::Json($user);

			return Angular::Redirect('/home');

		}
		// if not ask for permission first
		else {
			// get fb authorization
			$url = $fb->getAuthorizationUri();

			// return to facebook login url
			 return Redirect::to( (string)$url );
		}

	}


	public function anyLinkedin() {

		// get data from input
		$code = Input::get( 'code' );

		$linkedinService = OAuth::consumer( 'Linkedin' );


		// check if code is valid

		// if code is provided get user data and sign in
		if ( !empty( $code ) ) {

			// This was a callback request from linkedin, get the token
			$token = $linkedinService->requestAccessToken( $code );
			// Send a request with it. Please note that XML is the default format.
			$result = json_decode($linkedinService->request('/people/~?format=json'), true);

			$data = array(
				'id' => $result['id'],
				'name' => $result['firstName'] . ' ' . $result['lastName'],
				'email' => ''
				);
			$user = User::CreateFromProvider('linkedin',$data);

			if ($user !== false){
				Session::put('currentUser',$user);
			}
			

			return Angular::Redirect('home');
		}
		// if not ask for permission first
		else {
			// get linkedinService authorization
			$url = $linkedinService->getAuthorizationUri(array('state'=>'DCEEFWF45453sdffef424'));

			// return to linkedin login url
			return Redirect::to( (string)$url );
		}

		
	}
	public function anyInvite(){
		$code = Input::get( 'i' );

		try{
			$invite = Invite::resolveInvite($code);
			Session::put('invite',json_encode($invite));
			//return Response::Json( Session::get('invite'));
			return Angular::Redirect('/createuser');
		}
		catch(Exception $ex){
			die($ex->getMessage());
		}
	}
	public function anySendinvite(){
		$email = Input::get( 'email' );
		$company = Input::get( 'company' );

		return Response::Json(Invite::sendInvite($email,$company));
	}
	


}

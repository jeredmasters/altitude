<?php


class Angular {
	public static function isPhoneGap(){
		return Input::get('phonegap', 'false') == 'true';
	}
	public static function Redirect($path){
		if (Angular::isPhoneGap()){
			return Redirect::to('http://localhost/index.html#'.$path);
		}
		else{
			 return Redirect::to('/app/index.html#'.$path);

		}
	}

}

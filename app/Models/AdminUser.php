<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\Reminders\RemindableInterface;

class AdminUser extends BaseModel {

	/**
	 * The database table used by the model.
	 *
	 * @var string
	 */
	protected $table = 'admins';
	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected static $temp_code = '7835';
	protected $hidden = array('id', 'password');
	
    public static function check(){
        if (!Session::has('admin')){
            return false;
        }
        if (Session::get('admin') == static::$temp_code){
            return true;
        }
        return false;
    }

    public static function login($user,$pass){
        if ($pass == static::$temp_code){
            Session::set('admin', $pass);
            return true;
        }
        Session::set('admin', null);
        return false;
    }

    public static function end(){
        Session::set('admin', null);
    }

}

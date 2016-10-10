<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/



Route::get('/', function()
{
	return Angular::Redirect('/');
});
Route::when('data/*', 'auth');

Route::get('email/{id}', function($id)
{
    return View::make('emails.frame_web',['content' => Email::renderEmail($id)]);
});

Route::get('link/{id}', function($id)
{
    return Email::processEmail($id);
});

Route::controller('operation', 'OperationController');
Route::controller('admin', 'AdminController');
Route::controller('content', 'ContentController');

Route::controller('data', 'DataController');

Route::controllers([
    'auth' => 'Auth\AuthController',
    'password' => 'Auth\PasswordController',
]);
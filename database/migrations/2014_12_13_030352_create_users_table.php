<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('users', function($table)
		{
		    $table->increments('id');
            $table->string('key')->nullable();
		    $table->string('key_base')->nullable();
            $table->string('status')->default('active');
		    $table->string('company');
		    $table->string('username')->nullable();
		    $table->string('fullname');
		    $table->string('email');	
		    $table->text('password');
		    $table->string('roles')->default('[]');	
            $table->string('oauth_google')->nullable();	
		    $table->string('oauth_facebook')->nullable();
		    $table->string('oauth_linkedin')->nullable();	
		    $table->string('department')->nullable();
		    $table->string('groups')->nullable();
		    $table->boolean('superuser')->default(false);
            $table->boolean('confirmed')->default(false);
		    $table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('users');
	}

}

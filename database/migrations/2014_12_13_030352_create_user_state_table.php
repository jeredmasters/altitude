<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUserStateTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('user_state', function($table)
		{
		    $table->increments('id');
		    $table->string('user');
		    $table->string('last_ip')->default('');
            $table->integer('last_login')->default(0);
            $table->integer('last_update')->default(0); 
            $table->integer('last_touch')->default(0);
		    $table->string('settings')->default('{ }');
            $table->string('ui_state')->default('{ }');
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
		Schema::drop('user_state');
	}

}

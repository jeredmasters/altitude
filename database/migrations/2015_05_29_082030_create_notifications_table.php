<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateNotificationsTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('notifications', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->string('key');
		    $table->string('key_base');
            $table->string('status')->default('active');
		    $table->string('company');
		    $table->string('uquery');
		    $table->string('action');
		    $table->string('user');

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
		Schema::drop('notifications');
	}
}

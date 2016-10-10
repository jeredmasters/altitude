<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateInvitesTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('invites', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->string('company');
		    $table->string('email');
		    $table->boolean('spent')->default(false);
		    $table->string('created_by');
		    $table->string('roles')->default('[]');
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
		Schema::drop('invites');
	}
}
